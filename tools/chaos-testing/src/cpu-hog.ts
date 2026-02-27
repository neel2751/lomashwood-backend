import { promisify } from "util";
import { exec } from "child_process";
import { Command } from "commander";

const execAsync = promisify(exec);

interface CpuHogOptions {
  namespace: string;
  service: string;
  cpuPercent: number;
  duration: number;
  cores: number;
  dryRun: boolean;
}

interface CpuHogResult {
  pod: string;
  pid: string | null;
  started: boolean;
  stopped: boolean;
  peakCpuObserved: number | null;
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
    log("ERROR", `Could not list pods for ${service}`);
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
    return "1234";
  }

  try {
    const { stdout } = await execAsync(fullCmd);
    return stdout.trim();
  } catch (err) {
    log("ERROR", `exec failed in pod ${pod}: ${String(err)}`);
    return null;
  }
}

function buildCpuStressScript(cpuPercent: number, cores: number, durationSeconds: number): string {
  const stressPerCore = Math.min(cpuPercent, 100);

  const workerScript = [
    `end=$(($(date +%s) + ${durationSeconds}))`,
    `while [ $(date +%s) -lt $end ]; do`,
    `  load_end=$(($(date +%s%3N) + ${stressPerCore * 10}))`,
    `  while [ $(date +%s%3N) -lt $load_end ]; do :; done`,
    `  sleep 0.${String(100 - stressPerCore).padStart(3, "0")}`,
    `done`,
  ].join("; ");

  const workers = Array.from(
    { length: cores },
    () => `sh -c '${workerScript}' &`
  ).join(" ");

  return `${workers} wait`;
}

async function startCpuStress(
  namespace: string,
  pod: string,
  cpuPercent: number,
  cores: number,
  durationSeconds: number,
  dryRun: boolean
): Promise<string | null> {
  log("INFO", `Starting CPU stress on pod ${pod} — ${cpuPercent}% across ${cores} core(s) for ${durationSeconds}s`);

  const stressAvailable = dryRun || await checkToolAvailable(namespace, pod, "stress-ng");
  const yesAvailable = dryRun || await checkToolAvailable(namespace, pod, "yes");

  let startCmd: string;

  if (stressAvailable) {
    startCmd = `stress-ng --cpu ${cores} --cpu-load ${cpuPercent} --timeout ${durationSeconds}s --quiet &`;
    log("INFO", "Using stress-ng for CPU load");
  } else if (yesAvailable) {
    log("INFO", "Using yes-based CPU spinner");
    const spinners = Array.from(
      { length: cores },
      () => `(yes > /dev/null &)`
    ).join(" ");
    startCmd = `${spinners} echo $!`;
  } else {
    log("INFO", "Using pure shell CPU spinner");
    startCmd = buildCpuStressScript(cpuPercent, cores, durationSeconds);
    const bgCmd = `sh -c '${startCmd}' &\necho $!`;
    const pid = await execInPod(namespace, pod, bgCmd, dryRun);
    log("SUCCESS", `CPU stress started on ${pod} (PID: ${pid})`);
    return pid;
  }

  const result = await execInPod(namespace, pod, `${startCmd} && echo $!`, dryRun);

  if (result !== null) {
    log("SUCCESS", `CPU stress started on ${pod}`);
  }

  return result;
}

async function checkToolAvailable(namespace: string, pod: string, tool: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- which ${tool} 2>/dev/null`
    );
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}

async function stopCpuStress(
  namespace: string,
  pod: string,
  pid: string | null,
  dryRun: boolean
): Promise<boolean> {
  log("INFO", `Stopping CPU stress on pod ${pod}`);

  const killCommands = [
    "pkill -f stress-ng 2>/dev/null || true",
    "pkill -f 'yes > /dev/null' 2>/dev/null || true",
  ];

  if (pid) {
    killCommands.unshift(`kill -9 ${pid} 2>/dev/null || true`);
  }

  for (const cmd of killCommands) {
    await execInPod(namespace, pod, cmd, dryRun);
  }

  log("SUCCESS", `CPU stress stopped on pod ${pod}`);
  return true;
}

async function measureCpuUsage(namespace: string, pod: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- sh -c "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'" 2>/dev/null`
    );
    const value = parseFloat(stdout.trim());
    return isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

async function getTopProcesses(namespace: string, pod: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- sh -c "ps aux --sort=-%cpu | head -6" 2>/dev/null`
    );
    return stdout.trim();
  } catch {
    return null;
  }
}

async function runCpuHog(options: CpuHogOptions): Promise<void> {
  const { namespace, service, cpuPercent, duration, cores, dryRun } = options;

  log("INFO", "Lomash Wood Chaos — CPU Hog");
  log("INFO", `Namespace:   ${namespace}`);
  log("INFO", `Service:     ${service}`);
  log("INFO", `CPU load:    ${cpuPercent}%`);
  log("INFO", `Cores:       ${cores}`);
  log("INFO", `Duration:    ${duration}s`);
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
    log("WARN", "LIVE MODE — CPU stress will be applied to pods");
    log("WARN", "Waiting 5s. Ctrl+C to abort.");
    await sleep(5000);
  }

  const results: CpuHogResult[] = [];

  const podPids: Map<string, string | null> = new Map();

  for (const pod of pods) {
    const pid = await startCpuStress(namespace, pod, cpuPercent, cores, duration, dryRun);
    podPids.set(pod, pid);
    results.push({ pod, pid, started: pid !== null, stopped: false, peakCpuObserved: null });
  }

  process.once("SIGINT", async () => {
    log("WARN", "SIGINT received — stopping CPU stress before exit");
    for (const r of results) {
      if (r.started) {
        r.stopped = await stopCpuStress(namespace, r.pod, podPids.get(r.pod) || null, dryRun);
      }
    }
    printSummary(results, cpuPercent, duration);
    process.exit(0);
  });

  if (!dryRun) {
    const checkIntervalMs = 10000;
    let elapsed = 0;

    while (elapsed < duration * 1000) {
      await sleep(checkIntervalMs);
      elapsed += checkIntervalMs;

      const remaining = Math.max(0, duration - elapsed / 1000);
      log("INFO", `${remaining.toFixed(0)}s remaining`);

      for (const r of results) {
        if (r.started) {
          const cpuPct = await measureCpuUsage(namespace, r.pod);
          if (cpuPct !== null) {
            log("INFO", `Pod ${r.pod} — CPU: ${cpuPct.toFixed(1)}%`);
            if (r.peakCpuObserved === null || cpuPct > r.peakCpuObserved) {
              r.peakCpuObserved = cpuPct;
            }
          }
        }
      }
    }
  } else {
    await sleep(2000);
  }

  log("INFO", "Duration elapsed — stopping CPU stress");

  for (const r of results) {
    if (r.started) {
      r.stopped = await stopCpuStress(namespace, r.pod, podPids.get(r.pod) || null, dryRun);
    }
  }

  if (!dryRun) {
    await sleep(3000);
    log("INFO", "Post-experiment top processes:");
    for (const r of results) {
      const top = await getTopProcesses(namespace, r.pod);
      if (top) {
        console.log(`\n--- ${r.pod} ---\n${top}`);
      }
    }
  }

  printSummary(results, cpuPercent, duration);
}

function printSummary(results: CpuHogResult[], cpuPercent: number, durationS: number): void {
  console.log("");
  log("INFO", "CPU Hog Summary");
  console.log("===============");
  results.forEach((r) => {
    const started = r.started ? "STARTED" : "FAILED ";
    const stopped = r.stopped ? "STOPPED" : "NOT STOPPED";
    const peak = r.peakCpuObserved !== null ? `peak ${r.peakCpuObserved.toFixed(1)}%` : "no measurement";
    console.log(`  ${r.pod} — ${started} / ${stopped} / ${peak}`);
  });

  console.log("");
  log("INFO", `Target CPU:    ${cpuPercent}%`);
  log("INFO", `Duration:      ${durationS}s`);
  log("INFO", `Pods affected: ${results.filter((r) => r.started).length}`);
  log("INFO", `Pods cleaned:  ${results.filter((r) => r.stopped).length}`);
}

const program = new Command();

program
  .name("cpu-hog")
  .description("Applies CPU stress to Lomash Wood service pods to simulate high load conditions")
  .requiredOption("-s, --service <n>", "Target service name")
  .option("-n, --namespace <ns>", "Kubernetes namespace", "lomash-wood")
  .option("-c, --cpu-percent <pct>", "Target CPU utilisation percentage (0-100)", "80")
  .option("-k, --cores <n>", "Number of CPU worker threads", "1")
  .option("-d, --duration <seconds>", "How long to apply CPU stress", "60")
  .option("--dry-run", "Print commands without executing", false)
  .action((opts) => {
    runCpuHog({
      namespace: opts.namespace,
      service: opts.service,
      cpuPercent: parseInt(opts.cpuPercent, 10),
      duration: parseInt(opts.duration, 10),
      cores: parseInt(opts.cores, 10),
      dryRun: opts.dryRun,
    }).catch((err) => {
      log("ERROR", String(err));
      process.exit(1);
    });
  });

program.parse(process.argv);