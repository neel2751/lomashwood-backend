import { execSync } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import { Command } from "commander";

const execAsync = promisify(exec);

interface LatencyInjectorOptions {
  namespace: string;
  service: string;
  latencyMs: number;
  jitterMs: number;
  duration: number;
  dryRun: boolean;
  targetPort: number | null;
}

interface InjectionResult {
  pod: string;
  injected: boolean;
  restored: boolean;
  avgLatencyObservedMs: number | null;
}

const LOMASH_SERVICES = [
  "api-gateway",
  "auth-service",
  "product-service",
  "order-payment-service",
  "appointment-service",
  "content-service",
  "customer-service",
  "notification-service",
  "analytics-service",
];

function log(level: "INFO" | "WARN" | "ERROR" | "SUCCESS", message: string): void {
  const ts = new Date().toISOString();
  const prefix = {
    INFO: "[INFO] ",
    WARN: "[WARN] ",
    ERROR: "[ERROR]",
    SUCCESS: "[OK]   ",
  }[level];
  console.log(`${ts} ${prefix} ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRunningPods(namespace: string, service: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      `kubectl get pods -n ${namespace} -l app=${service} --field-selector=status.phase=Running -o jsonpath='{.items[*].metadata.name}'`
    );
    return stdout.trim().split(/\s+/).filter(Boolean);
  } catch {
    log("ERROR", `Could not list pods for ${service} in ${namespace}`);
    return [];
  }
}

async function execInPod(
  namespace: string,
  pod: string,
  command: string,
  dryRun: boolean
): Promise<string | null> {
  const fullCmd = `kubectl exec -n ${namespace} ${pod} -- sh -c "${command}"`;

  if (dryRun) {
    log("INFO", `[DRY RUN] ${fullCmd}`);
    return "dry-run-output";
  }

  try {
    const { stdout } = await execAsync(fullCmd);
    return stdout.trim();
  } catch (err) {
    log("ERROR", `exec failed in pod ${pod}: ${String(err)}`);
    return null;
  }
}

async function checkTcAvailable(namespace: string, pod: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- which tc 2>/dev/null`
    );
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}

async function injectLatency(
  namespace: string,
  pod: string,
  latencyMs: number,
  jitterMs: number,
  targetPort: number | null,
  dryRun: boolean
): Promise<boolean> {
  log("INFO", `Injecting ${latencyMs}ms latency (±${jitterMs}ms jitter) into pod: ${pod}`);

  const tcAvailable = dryRun || (await checkTcAvailable(namespace, pod));

  if (!tcAvailable) {
    log("WARN", `tc not available in pod ${pod} — using iptables fallback`);

    const portFilter = targetPort ? `--dport ${targetPort}` : "";
    const iptablesCmd = [
      `iptables -t mangle -A OUTPUT ${portFilter} -j MARK --set-mark 1`,
      `tc qdisc add dev eth0 root handle 1: prio`,
      `tc qdisc add dev eth0 parent 1:3 handle 30: netem delay ${latencyMs}ms ${jitterMs}ms`,
      `tc filter add dev eth0 parent 1:0 protocol ip handle 1 fw flowid 1:3`,
    ].join(" && ");

    const result = await execInPod(namespace, pod, iptablesCmd, dryRun);
    return result !== null;
  }

  const iface = "eth0";
  const commands = [
    `tc qdisc del dev ${iface} root 2>/dev/null || true`,
    `tc qdisc add dev ${iface} root netem delay ${latencyMs}ms ${jitterMs}ms distribution normal`,
  ];

  if (targetPort) {
    commands[1] = [
      `tc qdisc add dev ${iface} root handle 1: prio priomap 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0`,
      `tc qdisc add dev ${iface} parent 1:3 handle 30: netem delay ${latencyMs}ms ${jitterMs}ms`,
      `tc filter add dev ${iface} parent 1:0 protocol ip u32 match ip dport ${targetPort} 0xffff flowid 1:3`,
    ].join(" && ");
  }

  for (const cmd of commands) {
    const result = await execInPod(namespace, pod, cmd, dryRun);
    if (result === null && !dryRun) {
      log("ERROR", `Failed to apply tc rule in pod ${pod}`);
      return false;
    }
  }

  log("SUCCESS", `Latency injected into pod: ${pod}`);
  return true;
}

async function removeLatency(
  namespace: string,
  pod: string,
  dryRun: boolean
): Promise<boolean> {
  log("INFO", `Removing latency from pod: ${pod}`);

  const commands = [
    "tc qdisc del dev eth0 root 2>/dev/null || true",
    "iptables -t mangle -F 2>/dev/null || true",
  ];

  for (const cmd of commands) {
    await execInPod(namespace, pod, cmd, dryRun);
  }

  log("SUCCESS", `Latency removed from pod: ${pod}`);
  return true;
}

async function measureLatency(
  namespace: string,
  pod: string,
  targetHost: string,
  sampleCount: number
): Promise<number | null> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- sh -c "for i in $(seq 1 ${sampleCount}); do curl -sf -o /dev/null -w '%{time_total}\\n' http://${targetHost}/health; done" 2>/dev/null`
    );

    const times = stdout
      .trim()
      .split("\n")
      .map((t) => parseFloat(t) * 1000)
      .filter((t) => !isNaN(t));

    if (times.length === 0) return null;

    return times.reduce((a, b) => a + b, 0) / times.length;
  } catch {
    return null;
  }
}

async function runLatencyInjector(options: LatencyInjectorOptions): Promise<void> {
  const {
    namespace,
    service,
    latencyMs,
    jitterMs,
    duration,
    dryRun,
    targetPort,
  } = options;

  log("INFO", "Lomash Wood Chaos — Latency Injector");
  log("INFO", `Namespace:   ${namespace}`);
  log("INFO", `Service:     ${service}`);
  log("INFO", `Latency:     ${latencyMs}ms ± ${jitterMs}ms`);
  log("INFO", `Duration:    ${duration}s`);
  log("INFO", `Target port: ${targetPort || "all"}`);
  log("INFO", `Dry run:     ${dryRun}`);
  console.log("");

  if (!LOMASH_SERVICES.includes(service)) {
    log("WARN", `Service "${service}" not in known services list — proceeding anyway`);
  }

  const pods = await getRunningPods(namespace, service);

  if (pods.length === 0) {
    log("ERROR", `No running pods found for service: ${service}`);
    process.exit(1);
  }

  log("INFO", `Found ${pods.length} pod(s): ${pods.join(", ")}`);

  if (!dryRun) {
    log("WARN", "LIVE MODE — network latency will be injected");
    log("WARN", "Waiting 5s before starting. Ctrl+C to abort.");
    await sleep(5000);
  }

  const results: InjectionResult[] = [];

  for (const pod of pods) {
    const injected = await injectLatency(namespace, pod, latencyMs, jitterMs, targetPort, dryRun);
    results.push({ pod, injected, restored: false, avgLatencyObservedMs: null });
  }

  if (results.some((r) => r.injected)) {
    log("INFO", `Latency active for ${duration}s...`);

    if (!dryRun) {
      const checkInterval = Math.min(30000, duration * 200);
      let elapsed = 0;

      while (elapsed < duration * 1000) {
        await sleep(checkInterval);
        elapsed += checkInterval;

        for (const pod of pods) {
          const avg = await measureLatency(namespace, pod, `${service}:3000`, 3);
          if (avg !== null) {
            log("INFO", `Pod ${pod} — measured avg latency: ${avg.toFixed(0)}ms`);
          }
        }
      }
    } else {
      await sleep(2000);
    }

    log("INFO", "Duration elapsed — removing latency");
  }

  const setupSignalHandler = (): void => {
    process.once("SIGINT", async () => {
      log("WARN", "SIGINT received — removing latency before exit");
      for (const r of results) {
        if (r.injected) {
          r.restored = await removeLatency(namespace, r.pod, dryRun);
        }
      }
      printSummary(results, latencyMs, duration);
      process.exit(0);
    });
  };

  setupSignalHandler();

  for (const r of results) {
    if (r.injected) {
      r.restored = await removeLatency(namespace, r.pod, dryRun);
    }
  }

  printSummary(results, latencyMs, duration);
}

function printSummary(results: InjectionResult[], targetLatencyMs: number, durationS: number): void {
  console.log("");
  log("INFO", "Latency Injector Summary");
  console.log("========================");
  results.forEach((r) => {
    const inj = r.injected ? "INJECTED" : "FAILED  ";
    const rst = r.restored ? "RESTORED" : "NOT RESTORED";
    const obs = r.avgLatencyObservedMs !== null ? `${r.avgLatencyObservedMs.toFixed(0)}ms observed` : "no measurement";
    console.log(`  ${r.pod} — ${inj} / ${rst} / ${obs}`);
  });

  console.log("");
  log("INFO", `Target latency:  ${targetLatencyMs}ms`);
  log("INFO", `Duration:        ${durationS}s`);
  log("INFO", `Pods affected:   ${results.filter((r) => r.injected).length}`);
  log("INFO", `Pods restored:   ${results.filter((r) => r.restored).length}`);
}

const program = new Command();

program
  .name("latency-injector")
  .description("Injects artificial network latency into Lomash Wood service pods via tc netem")
  .requiredOption("-s, --service <name>", "Target service name")
  .option("-n, --namespace <ns>", "Kubernetes namespace", "lomash-wood")
  .option("-l, --latency <ms>", "Latency to inject in milliseconds", "200")
  .option("-j, --jitter <ms>", "Jitter in milliseconds", "50")
  .option("-d, --duration <seconds>", "How long to hold the latency", "60")
  .option("-p, --target-port <port>", "Only delay traffic on this port (optional)")
  .option("--dry-run", "Print commands without executing", false)
  .action((opts) => {
    runLatencyInjector({
      namespace: opts.namespace,
      service: opts.service,
      latencyMs: parseInt(opts.latency, 10),
      jitterMs: parseInt(opts.jitter, 10),
      duration: parseInt(opts.duration, 10),
      dryRun: opts.dryRun,
      targetPort: opts.targetPort ? parseInt(opts.targetPort, 10) : null,
    }).catch((err) => {
      log("ERROR", String(err));
      process.exit(1);
    });
  });

program.parse(process.argv);