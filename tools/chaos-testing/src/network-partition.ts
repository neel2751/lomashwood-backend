import { promisify } from "util";
import { exec } from "child_process";
import { Command } from "commander";

const execAsync = promisify(exec);

interface NetworkPartitionOptions {
  namespace: string;
  sourceService: string;
  targetService: string | null;
  targetHost: string | null;
  targetPort: number | null;
  duration: number;
  dropPercent: number;
  dryRun: boolean;
  bidirectional: boolean;
}

interface PartitionResult {
  pod: string;
  direction: "egress" | "ingress" | "both";
  applied: boolean;
  restored: boolean;
  connectivityPreMs: number | null;
  connectivityPostMs: number | null;
  packetsDropped: number | null;
}

const SERVICE_CLUSTER_IPS: Record<string, string> = {
  "api-gateway": "api-gateway.lomash-wood.svc.cluster.local",
  "auth-service": "auth-service.lomash-wood.svc.cluster.local",
  "product-service": "product-service.lomash-wood.svc.cluster.local",
  "order-payment-service": "order-payment-service.lomash-wood.svc.cluster.local",
  "appointment-service": "appointment-service.lomash-wood.svc.cluster.local",
  "content-service": "content-service.lomash-wood.svc.cluster.local",
  "customer-service": "customer-service.lomash-wood.svc.cluster.local",
  "notification-service": "notification-service.lomash-wood.svc.cluster.local",
  "analytics-service": "analytics-service.lomash-wood.svc.cluster.local",
  "postgres": "postgres.lomash-wood.svc.cluster.local",
  "redis": "redis.lomash-wood.svc.cluster.local",
};

const LOMASH_SERVICES = Object.keys(SERVICE_CLUSTER_IPS);

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

async function resolveServiceIp(namespace: string, pod: string, serviceName: string, dryRun: boolean): Promise<string | null> {
  const hostname = SERVICE_CLUSTER_IPS[serviceName] || serviceName;

  if (dryRun) {
    return "10.96.0.1";
  }

  try {
    const result = await execInPod(
      namespace,
      pod,
      `getent hosts ${hostname} | awk '{print $1}' | head -1`,
      false
    );
    return result || null;
  } catch {
    return null;
  }
}

function buildIptablesDropRule(
  direction: "OUTPUT" | "INPUT",
  targetIp: string | null,
  targetPort: number | null,
  dropPercent: number
): string {
  const parts = [`iptables -A ${direction}`];

  if (targetIp) {
    parts.push(direction === "OUTPUT" ? `-d ${targetIp}` : `-s ${targetIp}`);
  }

  if (targetPort) {
    parts.push(`-p tcp --dport ${targetPort}`);
  }

  if (dropPercent >= 100) {
    parts.push("-j DROP");
  } else {
    parts.push(`-m statistic --mode random --probability ${(dropPercent / 100).toFixed(2)} -j DROP`);
  }

  return parts.join(" ");
}

function buildIptablesDeleteRule(
  direction: "OUTPUT" | "INPUT",
  targetIp: string | null,
  targetPort: number | null,
  dropPercent: number
): string {
  return buildIptablesDropRule(direction, targetIp, targetPort, dropPercent).replace(
    `iptables -A ${direction}`,
    `iptables -D ${direction}`
  );
}

async function applyNetworkPartition(
  namespace: string,
  pod: string,
  targetIp: string | null,
  targetPort: number | null,
  dropPercent: number,
  bidirectional: boolean,
  dryRun: boolean
): Promise<boolean> {
  const target = targetIp ? `${targetIp}${targetPort ? `:${targetPort}` : ""}` : "all traffic";
  log("INFO", `Partitioning pod ${pod} — dropping ${dropPercent}% packets to ${target}`);

  const egressRule = buildIptablesDropRule("OUTPUT", targetIp, targetPort, dropPercent);
  const result = await execInPod(namespace, pod, egressRule, dryRun);

  if (result === null && !dryRun) {
    log("ERROR", `Failed to apply egress partition to pod ${pod}`);
    return false;
  }

  if (bidirectional) {
    const ingressRule = buildIptablesDropRule("INPUT", targetIp, targetPort, dropPercent);
    const ingressResult = await execInPod(namespace, pod, ingressRule, dryRun);

    if (ingressResult === null && !dryRun) {
      log("WARN", `Egress partition applied but ingress failed for pod ${pod}`);
    }
  }

  log("SUCCESS", `Network partition applied to pod ${pod}`);
  return true;
}

async function removeNetworkPartition(
  namespace: string,
  pod: string,
  targetIp: string | null,
  targetPort: number | null,
  dropPercent: number,
  bidirectional: boolean,
  dryRun: boolean
): Promise<boolean> {
  log("INFO", `Removing network partition from pod ${pod}`);

  const deleteEgressRule = buildIptablesDeleteRule("OUTPUT", targetIp, targetPort, dropPercent);
  await execInPod(namespace, pod, `${deleteEgressRule} 2>/dev/null || true`, dryRun);

  if (bidirectional) {
    const deleteIngressRule = buildIptablesDeleteRule("INPUT", targetIp, targetPort, dropPercent);
    await execInPod(namespace, pod, `${deleteIngressRule} 2>/dev/null || true`, dryRun);
  }

  log("SUCCESS", `Network partition removed from pod ${pod}`);
  return true;
}

async function measureConnectivity(
  namespace: string,
  pod: string,
  targetHost: string,
  targetPort: number,
  dryRun: boolean
): Promise<number | null> {
  if (dryRun) return 5;

  try {
    const result = await execInPod(
      namespace,
      pod,
      `curl -sf -o /dev/null -w '%{time_connect}' http://${targetHost}:${targetPort}/health --max-time 5`,
      false
    );

    if (result === null) return null;
    const ms = parseFloat(result) * 1000;
    return isNaN(ms) ? null : Math.round(ms);
  } catch {
    return null;
  }
}

async function getPacketDropStats(namespace: string, pod: string, dryRun: boolean): Promise<number | null> {
  if (dryRun) return 0;

  try {
    const result = await execInPod(
      namespace,
      pod,
      "iptables -L OUTPUT -n -v 2>/dev/null | grep DROP | awk '{print $1}'",
      false
    );

    if (result === null) return null;
    const count = parseInt(result, 10);
    return isNaN(count) ? null : count;
  } catch {
    return null;
  }
}

async function runNetworkPartition(options: NetworkPartitionOptions): Promise<void> {
  const {
    namespace,
    sourceService,
    targetService,
    targetHost,
    targetPort,
    duration,
    dropPercent,
    dryRun,
    bidirectional,
  } = options;

  const resolvedTarget = targetService
    ? SERVICE_CLUSTER_IPS[targetService] || targetService
    : targetHost;

  log("INFO", "Lomash Wood Chaos — Network Partition");
  log("INFO", `Namespace:       ${namespace}`);
  log("INFO", `Source service:  ${sourceService}`);
  log("INFO", `Target:          ${resolvedTarget || "all"}`);
  log("INFO", `Target port:     ${targetPort || "all"}`);
  log("INFO", `Drop percent:    ${dropPercent}%`);
  log("INFO", `Duration:        ${duration}s`);
  log("INFO", `Bidirectional:   ${bidirectional}`);
  log("INFO", `Dry run:         ${dryRun}`);
  console.log("");

  if (dropPercent >= 100) {
    log("WARN", "100% packet drop — full network partition");
    if (targetService === "postgres" || targetService === "redis") {
      log("WARN", `Cutting off ${targetService} may cause cascading failures and data loss`);
    }
  }

  const pods = await getRunningPods(namespace, sourceService);

  if (pods.length === 0) {
    log("ERROR", `No running pods found for source service: ${sourceService}`);
    process.exit(1);
  }

  log("INFO", `Found ${pods.length} source pod(s): ${pods.join(", ")}`);

  if (!dryRun) {
    log("WARN", "LIVE MODE — network rules will be applied");
    log("WARN", "Waiting 5s. Ctrl+C to abort.");
    await sleep(5000);
  }

  const results: PartitionResult[] = [];

  for (const pod of pods) {
    let resolvedIp: string | null = null;

    if (targetService || targetHost) {
      resolvedIp = targetService
        ? await resolveServiceIp(namespace, pod, targetService, dryRun)
        : targetHost ?? null;

      if (!resolvedIp && !dryRun) {
        log("WARN", `Could not resolve IP for target — applying broad rule`);
      }
    }

    const measureTarget = targetService || "api-gateway";
    const measurePort = targetPort || 3000;

    const connectPre = await measureConnectivity(namespace, pod, measureTarget, measurePort, dryRun);
    log("INFO", `Pod ${pod} pre-partition connectivity: ${connectPre !== null ? `${connectPre}ms` : "unreachable"}`);

    const applied = await applyNetworkPartition(
      namespace, pod, resolvedIp, targetPort, dropPercent, bidirectional, dryRun
    );

    results.push({
      pod,
      direction: bidirectional ? "both" : "egress",
      applied,
      restored: false,
      connectivityPreMs: connectPre,
      connectivityPostMs: null,
      packetsDropped: null,
    });
  }

  process.once("SIGINT", async () => {
    log("WARN", "SIGINT received — removing network partition");

    for (const r of results) {
      if (r.applied) {
        const pod = r.pod;
        let resolvedIp: string | null = null;
        if (targetService || targetHost) {
          resolvedIp = targetService
            ? await resolveServiceIp(namespace, pod, targetService, dryRun)
            : targetHost ?? null;
        }
        r.restored = await removeNetworkPartition(namespace, pod, resolvedIp, targetPort, dropPercent, bidirectional, dryRun);
      }
    }

    printSummary(results, sourceService, resolvedTarget || "all", dropPercent, duration);
    process.exit(0);
  });

  if (!dryRun) {
    const checkIntervalMs = 10000;
    let elapsed = 0;

    while (elapsed < duration * 1000) {
      await sleep(checkIntervalMs);
      elapsed += checkIntervalMs;

      const remaining = Math.max(0, duration - elapsed / 1000);
      log("INFO", `Partition active — ${remaining.toFixed(0)}s remaining`);

      for (const r of results) {
        if (!r.applied) continue;

        const dropped = await getPacketDropStats(namespace, r.pod, dryRun);
        if (dropped !== null) {
          r.packetsDropped = dropped;
          log("INFO", `Pod ${r.pod} — packets dropped so far: ${dropped}`);
        }
      }
    }
  } else {
    await sleep(2000);
  }

  log("INFO", "Duration elapsed — removing network partition");

  for (const r of results) {
    if (r.applied) {
      let resolvedIp: string | null = null;
      if (targetService || targetHost) {
        resolvedIp = targetService
          ? await resolveServiceIp(namespace, r.pod, targetService, dryRun)
          : targetHost ?? null;
      }

      r.restored = await removeNetworkPartition(
        namespace, r.pod, resolvedIp, targetPort, dropPercent, bidirectional, dryRun
      );

      const measureTarget = targetService || "api-gateway";
      const measurePort = targetPort || 3000;
      await sleep(2000);

      const connectPost = await measureConnectivity(namespace, r.pod, measureTarget, measurePort, dryRun);
      r.connectivityPostMs = connectPost;
      log("INFO", `Pod ${r.pod} post-partition connectivity: ${connectPost !== null ? `${connectPost}ms` : "still unreachable"}`);
    }
  }

  printSummary(results, sourceService, resolvedTarget || "all", dropPercent, duration);
}

function printSummary(
  results: PartitionResult[],
  source: string,
  target: string,
  dropPercent: number,
  durationS: number
): void {
  console.log("");
  log("INFO", "Network Partition Summary");
  console.log("=========================");
  results.forEach((r) => {
    const applied = r.applied ? "APPLIED " : "FAILED  ";
    const restored = r.restored ? "RESTORED" : "NOT RESTORED";
    const prems = r.connectivityPreMs !== null ? `pre: ${r.connectivityPreMs}ms` : "pre: N/A";
    const postms = r.connectivityPostMs !== null ? `post: ${r.connectivityPostMs}ms` : "post: N/A";
    const dropped = r.packetsDropped !== null ? `dropped: ${r.packetsDropped} pkts` : "dropped: N/A";
    console.log(`  ${r.pod} — ${applied} / ${restored} / ${prems} / ${postms} / ${dropped}`);
  });

  console.log("");
  log("INFO", `Source service:  ${source}`);
  log("INFO", `Target:          ${target}`);
  log("INFO", `Drop rate:       ${dropPercent}%`);
  log("INFO", `Duration:        ${durationS}s`);
  log("INFO", `Pods affected:   ${results.filter((r) => r.applied).length}`);
  log("INFO", `Pods restored:   ${results.filter((r) => r.restored).length}`);

  const unrestored = results.filter((r) => r.applied && !r.restored);
  if (unrestored.length > 0) {
    log("ERROR", `${unrestored.length} pod(s) not restored — manual cleanup required:`);
    unrestored.forEach((r) => log("ERROR", `  kubectl exec -n lomash-wood ${r.pod} -- iptables -F`));
  }
}

const program = new Command();

program
  .name("network-partition")
  .description("Simulates network partitions between Lomash Wood services using iptables")
  .requiredOption("-s, --source-service <n>", "Source service to partition FROM")
  .option("-t, --target-service <n>", "Target service to block (uses cluster DNS)")
  .option("-H, --target-host <host>", "Target hostname/IP to block (alternative to --target-service)")
  .option("-p, --target-port <port>", "Only block this port (optional)")
  .option("-n, --namespace <ns>", "Kubernetes namespace", "lomash-wood")
  .option("-d, --duration <seconds>", "How long to hold the partition", "60")
  .option("--drop-percent <pct>", "Packet drop percentage (100 = full partition)", "100")
  .option("--bidirectional", "Block both ingress and egress", false)
  .option("--dry-run", "Print commands without executing", false)
  .action((opts) => {
    if (!opts.targetService && !opts.targetHost) {
      log("WARN", "No target specified — partition will affect all egress traffic from source service");
    }

    runNetworkPartition({
      namespace: opts.namespace,
      sourceService: opts.sourceService,
      targetService: opts.targetService || null,
      targetHost: opts.targetHost || null,
      targetPort: opts.targetPort ? parseInt(opts.targetPort, 10) : null,
      duration: parseInt(opts.duration, 10),
      dropPercent: parseInt(opts.dropPercent, 10),
      dryRun: opts.dryRun,
      bidirectional: opts.bidirectional,
    }).catch((err) => {
      log("ERROR", String(err));
      process.exit(1);
    });
  });

program.parse(process.argv);