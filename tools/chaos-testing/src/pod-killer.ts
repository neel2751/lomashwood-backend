import { execSync, exec } from "child_process";
import { promisify } from "util";
import { Command } from "commander";

const execAsync = promisify(exec);

interface PodKillerOptions {
  namespace: string;
  service: string | null;
  interval: number;
  count: number;
  dryRun: boolean;
  gracePeriod: number;
}

interface Pod {
  name: string;
  ready: string;
  status: string;
  restarts: string;
  age: string;
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

async function getPodsInNamespace(namespace: string, labelSelector?: string): Promise<Pod[]> {
  const selector = labelSelector ? `-l ${labelSelector}` : "";
  const cmd = `kubectl get pods -n ${namespace} ${selector} --no-headers -o custom-columns="NAME:.metadata.name,READY:.status.containerStatuses[0].ready,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp"`;

  try {
    const { stdout } = await execAsync(cmd);
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0],
          ready: parts[1] || "unknown",
          status: parts[2] || "unknown",
          restarts: parts[3] || "0",
          age: parts[4] || "unknown",
        };
      })
      .filter((pod) => pod.status === "Running");
  } catch {
    log("ERROR", `Failed to get pods in namespace ${namespace}`);
    return [];
  }
}

async function getPodsForService(namespace: string, service: string): Promise<Pod[]> {
  return getPodsInNamespace(namespace, `app=${service}`);
}

async function killPod(namespace: string, podName: string, gracePeriod: number, dryRun: boolean): Promise<boolean> {
  const cmd = `kubectl delete pod ${podName} -n ${namespace} --grace-period=${gracePeriod}`;

  if (dryRun) {
    log("INFO", `[DRY RUN] Would execute: ${cmd}`);
    return true;
  }

  try {
    await execAsync(cmd);
    log("SUCCESS", `Killed pod: ${podName}`);
    return true;
  } catch (err) {
    log("ERROR", `Failed to kill pod ${podName}: ${String(err)}`);
    return false;
  }
}

async function waitForPodRecovery(namespace: string, service: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  const interval = 5000;

  log("INFO", `Waiting for ${service} to recover...`);

  while (Date.now() - start < timeoutMs) {
    const pods = await getPodsForService(namespace, service);
    const runningPods = pods.filter((p) => p.status === "Running");

    if (runningPods.length > 0) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      log("SUCCESS", `${service} recovered in ${elapsed}s with ${runningPods.length} running pod(s)`);
      return true;
    }

    await sleep(interval);
  }

  log("WARN", `${service} did not recover within ${timeoutMs / 1000}s timeout`);
  return false;
}

async function checkApiHealth(apiUrl: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`curl -sf ${apiUrl}/health --max-time 5`);
    const body = JSON.parse(stdout);
    return body.status === "ok" || body.status === "healthy";
  } catch {
    return false;
  }
}

async function runPodKiller(options: PodKillerOptions): Promise<void> {
  const {
    namespace,
    service,
    interval,
    count,
    dryRun,
    gracePeriod,
  } = options;

  log("INFO", "Lomash Wood Chaos — Pod Killer");
  log("INFO", `Namespace:    ${namespace}`);
  log("INFO", `Target:       ${service || "ALL services (random)"}`);
  log("INFO", `Kill count:   ${count}`);
  log("INFO", `Interval:     ${interval}s`);
  log("INFO", `Grace period: ${gracePeriod}s`);
  log("INFO", `Dry run:      ${dryRun}`);
  console.log("");

  if (!dryRun) {
    log("WARN", "LIVE MODE — pods will actually be terminated");
    log("WARN", "Waiting 5s before starting. Ctrl+C to abort.");
    await sleep(5000);
  }

  const results: { pod: string; service: string; killed: boolean; recovered: boolean }[] = [];

  for (let i = 0; i < count; i++) {
    log("INFO", `Kill ${i + 1} of ${count}`);

    const targetService = service || LOMASH_SERVICES[Math.floor(Math.random() * LOMASH_SERVICES.length)];
    const pods = await getPodsForService(namespace, targetService);

    if (pods.length === 0) {
      log("WARN", `No running pods found for service: ${targetService}`);
      results.push({ pod: "none", service: targetService, killed: false, recovered: false });
      continue;
    }

    if (pods.length === 1) {
      log("WARN", `Only 1 pod running for ${targetService} — killing it will cause downtime`);
    }

    const targetPod = pods[Math.floor(Math.random() * pods.length)];
    log("INFO", `Targeting pod: ${targetPod.name} (service: ${targetService}, restarts: ${targetPod.restarts})`);

    const killed = await killPod(namespace, targetPod.name, gracePeriod, dryRun);

    let recovered = false;
    if (killed && !dryRun) {
      recovered = await waitForPodRecovery(namespace, targetService, 120000);
    } else if (killed && dryRun) {
      recovered = true;
    }

    results.push({ pod: targetPod.name, service: targetService, killed, recovered });

    if (i < count - 1) {
      log("INFO", `Waiting ${interval}s before next kill...`);
      await sleep(interval * 1000);
    }
  }

  console.log("");
  log("INFO", "Pod Killer Summary");
  console.log("==================");
  results.forEach((r, idx) => {
    const killedStr = r.killed ? "KILLED" : "FAILED";
    const recoveredStr = r.recovered ? "RECOVERED" : "NOT RECOVERED";
    console.log(`  ${idx + 1}. ${r.service} / ${r.pod} — ${killedStr} / ${recoveredStr}`);
  });

  const totalKilled = results.filter((r) => r.killed).length;
  const totalRecovered = results.filter((r) => r.recovered).length;

  console.log("");
  log("INFO", `Total killed:    ${totalKilled} / ${count}`);
  log("INFO", `Total recovered: ${totalRecovered} / ${totalKilled}`);

  if (totalRecovered < totalKilled) {
    log("WARN", "Some services did not recover — manual intervention may be required");
    process.exit(1);
  }
}

const program = new Command();

program
  .name("pod-killer")
  .description("Randomly kills Kubernetes pods in the Lomash Wood namespace")
  .option("-n, --namespace <ns>", "Kubernetes namespace", "lomash-wood")
  .option("-s, --service <name>", "Target a specific service (default: random)")
  .option("-i, --interval <seconds>", "Seconds between kills", "30")
  .option("-c, --count <number>", "Number of pods to kill", "3")
  .option("-g, --grace-period <seconds>", "Pod deletion grace period in seconds", "0")
  .option("--dry-run", "Print commands without executing", false)
  .action((opts) => {
    runPodKiller({
      namespace: opts.namespace,
      service: opts.service || null,
      interval: parseInt(opts.interval, 10),
      count: parseInt(opts.count, 10),
      dryRun: opts.dryRun,
      gracePeriod: parseInt(opts.gracePeriod, 10),
    }).catch((err) => {
      log("ERROR", String(err));
      process.exit(1);
    });
  });

program.parse(process.argv);