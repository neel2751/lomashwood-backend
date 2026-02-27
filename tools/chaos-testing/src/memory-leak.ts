import { promisify } from "util";
import { exec } from "child_process";
import { Command } from "commander";

const execAsync = promisify(exec);

interface MemoryLeakOptions {
  namespace: string;
  service: string;
  targetMb: number;
  rampSeconds: number;
  holdSeconds: number;
  dryRun: boolean;
  watchOom: boolean;
}

interface MemoryResult {
  pod: string;
  started: boolean;
  stopped: boolean;
  peakMemoryMb: number | null;
  oomKilled: boolean;
  recoveryTimeMs: number | null;
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
    return "ok";
  }

  try {
    const { stdout } = await execAsync(fullCmd);
    return stdout.trim();
  } catch (err) {
    log("ERROR", `exec failed in pod ${pod}: ${String(err)}`);
    return null;
  }
}

function buildMemoryAllocScript(targetMb: number, rampSeconds: number, holdSeconds: number): string {
  const chunkMb = Math.max(10, Math.floor(targetMb / 20));
  const rampIntervalMs = Math.floor((rampSeconds * 1000) / (targetMb / chunkMb));

  return [
    `node -e "`,
    `const chunks = [];`,
    `const chunkSize = ${chunkMb} * 1024 * 1024;`,
    `const targetBytes = ${targetMb} * 1024 * 1024;`,
    `const rampIntervalMs = ${rampIntervalMs};`,
    `const holdMs = ${holdSeconds * 1000};`,
    `function allocate() {`,
    `  const current = chunks.reduce((s, c) => s + c.length, 0);`,
    `  if (current < targetBytes) {`,
    `    const buf = Buffer.alloc(chunkSize, 'x');`,
    `    chunks.push(buf);`,
    `    const mb = (current / 1024 / 1024).toFixed(0);`,
    `    process.stdout.write('alloc ' + mb + 'MB\\n');`,
    `    setTimeout(allocate, rampIntervalMs);`,
    `  } else {`,
    `    process.stdout.write('holding ' + ${targetMb} + 'MB for ${holdSeconds}s\\n');`,
    `    setTimeout(() => { chunks.length = 0; process.stdout.write('released\\n'); }, holdMs);`,
    `  }`,
    `}`,
    `allocate();`,
    `"`,
  ].join(" ");
}

function buildFallbackMemScript(targetMb: number, holdSeconds: number): string {
  const blockCount = Math.ceil(targetMb / 10);
  return [
    `python3 -c "`,
    `import time;`,
    `data = [];`,
    `for i in range(${blockCount}):`,
    `  data.append('x' * 10 * 1024 * 1024);`,
    `  print(f'alloc {(i+1)*10}MB');`,
    `  time.sleep(0.1)`,
    `print('holding ${targetMb}MB');`,
    `time.sleep(${holdSeconds});`,
    `del data;`,
    `print('released')`,
    `"`,
  ].join(" ");
}

async function checkNodeAvailable(namespace: string, pod: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- which node 2>/dev/null`
    );
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}

async function checkPythonAvailable(namespace: string, pod: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- which python3 2>/dev/null`
    );
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}

async function startMemoryLeak(
  namespace: string,
  pod: string,
  targetMb: number,
  rampSeconds: number,
  holdSeconds: number,
  dryRun: boolean
): Promise<boolean> {
  log("INFO", `Starting memory allocation on pod ${pod} — targeting ${targetMb}MB over ${rampSeconds}s, hold ${holdSeconds}s`);

  const nodeAvail = dryRun || await checkNodeAvailable(namespace, pod);
  const pythonAvail = dryRun || await checkPythonAvailable(namespace, pod);

  let script: string;

  if (nodeAvail) {
    log("INFO", "Using Node.js memory allocator");
    script = buildMemoryAllocScript(targetMb, rampSeconds, holdSeconds);
  } else if (pythonAvail) {
    log("INFO", "Using Python3 memory allocator");
    script = buildFallbackMemScript(targetMb, holdSeconds);
  } else {
    log("WARN", "No Node.js or Python3 available — using dd-based approach");
    script = [
      `mkdir -p /tmp/chaos-mem`,
      `dd if=/dev/urandom of=/tmp/chaos-mem/blob bs=1M count=${targetMb} 2>/dev/null`,
      `sleep ${holdSeconds}`,
      `rm -f /tmp/chaos-mem/blob`,
    ].join(" && ");
  }

  const bgScript = `(${script}) > /tmp/chaos-mem.log 2>&1 &\necho $!`;
  const result = await execInPod(namespace, pod, bgScript, dryRun);

  if (result !== null) {
    log("SUCCESS", `Memory allocator started on ${pod} (PID: ${result})`);
    return true;
  }

  return false;
}

async function getMemoryUsageMb(namespace: string, pod: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(
      `kubectl exec -n ${namespace} ${pod} -- sh -c "cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || cat /proc/meminfo | grep MemAvailable | awk '{print $2}'" 2>/dev/null`
    );
    const value = parseInt(stdout.trim(), 10);
    if (isNaN(value)) return null;
    return value > 1048576 ? Math.round(value / 1024 / 1024) : Math.round((1024 * 1024 - value) / 1024);
  } catch {
    return null;
  }
}

async function getPodMemoryFromMetrics(namespace: string, pod: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(
      `kubectl top pod ${pod} -n ${namespace} --no-headers 2>/dev/null`
    );
    const parts = stdout.trim().split(/\s+/);
    if (parts.length >= 3) {
      const memStr = parts[2];
      if (memStr.endsWith("Mi")) return parseInt(memStr, 10);
      if (memStr.endsWith("Gi")) return Math.round(parseFloat(memStr) * 1024);
    }
    return null;
  } catch {
    return null;
  }
}

async function isOomKilled(namespace: string, pod: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `kubectl get pod ${pod} -n ${namespace} -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}' 2>/dev/null`
    );
    return stdout.trim() === "OOMKilled";
  } catch {
    return false;
  }
}

async function stopMemoryLeak(namespace: string, pod: string, dryRun: boolean): Promise<boolean> {
  log("INFO", `Stopping memory allocator on pod ${pod}`);

  const cmds = [
    "pkill -f 'node -e' 2>/dev/null || true",
    "pkill -f 'python3 -c' 2>/dev/null || true",
    "rm -f /tmp/chaos-mem/blob /tmp/chaos-mem.log 2>/dev/null || true",
  ];

  for (const cmd of cmds) {
    await execInPod(namespace, pod, cmd, dryRun);
  }

  log("SUCCESS", `Memory allocator stopped on ${pod}`);
  return true;
}

async function waitForPodReady(namespace: string, pod: string, timeoutMs: number): Promise<number | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const { stdout } = await execAsync(
        `kubectl get pod ${pod} -n ${namespace} -o jsonpath='{.status.phase}' 2>/dev/null`
      );
      if (stdout.trim() === "Running") {
        return Date.now() - start;
      }
    } catch {
      // pod may be restarting
    }
    await sleep(3000);
  }

  return null;
}

async function runMemoryLeak(options: MemoryLeakOptions): Promise<void> {
  const { namespace, service, targetMb, rampSeconds, holdSeconds, dryRun, watchOom } = options;

  log("INFO", "Lomash Wood Chaos — Memory Pressure");
  log("INFO", `Namespace:   ${namespace}`);
  log("INFO", `Service:     ${service}`);
  log("INFO", `Target:      ${targetMb}MB`);
  log("INFO", `Ramp time:   ${rampSeconds}s`);
  log("INFO", `Hold time:   ${holdSeconds}s`);
  log("INFO", `Watch OOM:   ${watchOom}`);
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
    log("WARN", "LIVE MODE — memory pressure will be applied");
    log("WARN", "Pods may be OOM-killed if limit is exceeded");
    log("WARN", "Waiting 5s. Ctrl+C to abort.");
    await sleep(5000);
  }

  const results: MemoryResult[] = [];

  for (const pod of pods) {
    const started = await startMemoryLeak(namespace, pod, targetMb, rampSeconds, holdSeconds, dryRun);
    results.push({
      pod,
      started,
      stopped: false,
      peakMemoryMb: null,
      oomKilled: false,
      recoveryTimeMs: null,
    });
  }

  process.once("SIGINT", async () => {
    log("WARN", "SIGINT received — cleaning up memory allocators");
    for (const r of results) {
      if (r.started) {
        r.stopped = await stopMemoryLeak(namespace, r.pod, dryRun);
      }
    }
    printSummary(results, targetMb, rampSeconds, holdSeconds);
    process.exit(0);
  });

  if (!dryRun) {
    const totalDuration = (rampSeconds + holdSeconds) * 1000;
    const checkInterval = 5000;
    let elapsed = 0;

    while (elapsed < totalDuration) {
      await sleep(checkInterval);
      elapsed += checkInterval;

      for (const r of results) {
        if (!r.started) continue;

        const memMb = await getPodMemoryFromMetrics(namespace, r.pod);
        if (memMb !== null) {
          log("INFO", `Pod ${r.pod} — memory usage: ${memMb}MB`);
          if (r.peakMemoryMb === null || memMb > r.peakMemoryMb) {
            r.peakMemoryMb = memMb;
          }
        }

        if (watchOom) {
          const oomKilled = await isOomKilled(namespace, r.pod);
          if (oomKilled && !r.oomKilled) {
            r.oomKilled = true;
            log("WARN", `Pod ${r.pod} was OOM-killed — monitoring recovery`);

            const recoveryMs = await waitForPodReady(namespace, r.pod, 120000);
            r.recoveryTimeMs = recoveryMs;

            if (recoveryMs !== null) {
              log("SUCCESS", `Pod ${r.pod} recovered in ${(recoveryMs / 1000).toFixed(1)}s`);
            } else {
              log("ERROR", `Pod ${r.pod} did not recover within 120s`);
            }
          }
        }
      }
    }
  } else {
    await sleep(2000);
  }

  log("INFO", "Stopping memory allocators");

  for (const r of results) {
    if (r.started) {
      r.stopped = await stopMemoryLeak(namespace, r.pod, dryRun);
    }
  }

  printSummary(results, targetMb, rampSeconds, holdSeconds);
}

function printSummary(
  results: MemoryResult[],
  targetMb: number,
  rampSeconds: number,
  holdSeconds: number
): void {
  console.log("");
  log("INFO", "Memory Pressure Summary");
  console.log("=======================");
  results.forEach((r) => {
    const started = r.started ? "STARTED" : "FAILED ";
    const stopped = r.stopped ? "STOPPED" : "NOT STOPPED";
    const peak = r.peakMemoryMb !== null ? `peak ${r.peakMemoryMb}MB` : "no measurement";
    const oom = r.oomKilled ? `OOM-KILLED (recovered in ${r.recoveryTimeMs !== null ? (r.recoveryTimeMs / 1000).toFixed(1) + "s" : "N/A"})` : "no OOM";
    console.log(`  ${r.pod} — ${started} / ${stopped} / ${peak} / ${oom}`);
  });

  console.log("");
  log("INFO", `Target memory: ${targetMb}MB`);
  log("INFO", `Ramp time:     ${rampSeconds}s`);
  log("INFO", `Hold time:     ${holdSeconds}s`);
  log("INFO", `Pods affected: ${results.filter((r) => r.started).length}`);
  log("INFO", `OOM events:    ${results.filter((r) => r.oomKilled).length}`);
}

const program = new Command();

program
  .name("memory-leak")
  .description("Applies memory pressure to Lomash Wood service pods to simulate leaks and OOM conditions")
  .requiredOption("-s, --service <n>", "Target service name")
  .option("-n, --namespace <ns>", "Kubernetes namespace", "lomash-wood")
  .option("-m, --target-mb <mb>", "Target memory allocation in MB", "256")
  .option("-r, --ramp-seconds <s>", "Seconds to ramp up to target memory", "30")
  .option("-h, --hold-seconds <s>", "Seconds to hold at target memory", "60")
  .option("--watch-oom", "Watch for OOM kills and measure recovery time", false)
  .option("--dry-run", "Print commands without executing", false)
  .action((opts) => {
    runMemoryLeak({
      namespace: opts.namespace,
      service: opts.service,
      targetMb: parseInt(opts.targetMb, 10),
      rampSeconds: parseInt(opts.rampSeconds, 10),
      holdSeconds: parseInt(opts.holdSeconds, 10),
      dryRun: opts.dryRun,
      watchOom: opts.watchOom,
    }).catch((err) => {
      log("ERROR", String(err));
      process.exit(1);
    });
  });

program.parse(process.argv);