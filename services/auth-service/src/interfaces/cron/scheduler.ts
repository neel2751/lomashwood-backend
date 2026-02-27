import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../../config/logger';

export interface CronJob {
  name: string;
  schedule: string;
  timezone?: string;
  enabled?: boolean;
  handler: () => Promise<Record<string, unknown> | void>;
}

export interface JobExecutionResult {
  jobName: string;
  success: boolean;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface JobStatus {
  name: string;
  schedule: string;
  timezone: string;
  enabled: boolean;
  runCount: number;
  errorCount: number;
  lastRun?: Date;
  lastResult?: JobExecutionResult;
}

export interface SchedulerStatus {
  isRunning: boolean;
  totalJobs: number;
  jobs: JobStatus[];
}

export interface SchedulerOptions {
  timezone?: string;
  catchExceptions?: boolean;
  runOnInit?: boolean;
}

export class JobRegistry {
  private readonly jobs: Map<string, CronJob> = new Map();

  register(job: CronJob): void {
    if (this.jobs.has(job.name)) {
      logger.warn(`[JobRegistry] Job "${job.name}" is already registered. Overwriting.`);
    }
    this.jobs.set(job.name, job);
    logger.info(`[JobRegistry] Registered job: "${job.name}"`);
  }

  unregister(name: string): boolean {
    if (!this.jobs.has(name)) {
      logger.warn(`[JobRegistry] Job "${name}" not found in registry.`);
      return false;
    }
    this.jobs.delete(name);
    logger.info(`[JobRegistry] Unregistered job: "${name}"`);
    return true;
  }

  get(name: string): CronJob | undefined {
    return this.jobs.get(name);
  }

  getAll(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  has(name: string): boolean {
    return this.jobs.has(name);
  }

  clear(): void {
    this.jobs.clear();
  }
}

export const jobRegistry = new JobRegistry();

interface ActiveJob {
  task: ScheduledTask;
  definition: CronJob;
  lastRun?: Date;
  lastResult?: JobExecutionResult;
  runCount: number;
  errorCount: number;
}

export class CronScheduler {
  private readonly activeJobs: Map<string, ActiveJob> = new Map();
  private readonly registry: JobRegistry;
  private readonly options: Required<SchedulerOptions>;
  private isRunning: boolean = false;

  constructor(registry: JobRegistry, options: SchedulerOptions = {}) {
    this.registry = registry;
    this.options = {
      timezone: options.timezone ?? 'UTC',
      catchExceptions: options.catchExceptions ?? true,
      runOnInit: options.runOnInit ?? false,
    };
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[CronScheduler] Scheduler is already running. Skipping start.');
      return;
    }

    const jobs = this.registry.getAll();

    if (jobs.length === 0) {
      logger.warn('[CronScheduler] No jobs registered. Scheduler started with no active tasks.');
    }

    for (const job of jobs) {
      if (job.enabled === false) {
        logger.info(`[CronScheduler] Skipping disabled job: ${job.name}`);
        continue;
      }
      this.scheduleJob(job);
    }

    this.isRunning = true;
    logger.info(`[CronScheduler] Started with ${this.activeJobs.size} active job(s).`);

    if (this.options.runOnInit) {
      await this.runAllNow();
    }
  }

  public stop(): void {
    if (!this.isRunning) {
      logger.warn('[CronScheduler] Scheduler is not running.');
      return;
    }

    for (const [name, activeJob] of this.activeJobs.entries()) {
      activeJob.task.stop();
      logger.info(`[CronScheduler] Stopped job: ${name}`);
    }

    this.activeJobs.clear();
    this.isRunning = false;
    logger.info('[CronScheduler] All jobs stopped. Scheduler shut down.');
  }

  public scheduleJob(job: CronJob): void {
    if (this.activeJobs.has(job.name)) {
      logger.warn(`[CronScheduler] Job "${job.name}" is already scheduled. Skipping duplicate.`);
      return;
    }

    if (!cron.validate(job.schedule)) {
      logger.error(
        `[CronScheduler] Invalid cron expression for job "${job.name}": "${job.schedule}"`,
      );
      return;
    }

    const task = cron.schedule(
      job.schedule,
      async () => {
        await this.executeJob(job.name);
      },
      {
        timezone: job.timezone ?? this.options.timezone,
        scheduled: true,
      },
    );

    this.activeJobs.set(job.name, {
      task,
      definition: job,
      runCount: 0,
      errorCount: 0,
    });

    logger.info(
      `[CronScheduler] Scheduled job: "${job.name}" | Cron: "${job.schedule}" | TZ: "${job.timezone ?? this.options.timezone}"`,
    );
  }

  public unscheduleJob(name: string): boolean {
    const activeJob = this.activeJobs.get(name);

    if (!activeJob) {
      logger.warn(`[CronScheduler] Cannot unschedule unknown job: "${name}"`);
      return false;
    }

    activeJob.task.stop();
    this.activeJobs.delete(name);
    logger.info(`[CronScheduler] Unscheduled job: "${name}"`);
    return true;
  }

  public pauseJob(name: string): boolean {
    const activeJob = this.activeJobs.get(name);

    if (!activeJob) {
      logger.warn(`[CronScheduler] Cannot pause unknown job: "${name}"`);
      return false;
    }

    activeJob.task.stop();
    logger.info(`[CronScheduler] Paused job: "${name}"`);
    return true;
  }

  public resumeJob(name: string): boolean {
    const activeJob = this.activeJobs.get(name);

    if (!activeJob) {
      logger.warn(`[CronScheduler] Cannot resume unknown job: "${name}"`);
      return false;
    }

    activeJob.task.start();
    logger.info(`[CronScheduler] Resumed job: "${name}"`);
    return true;
  }

  public async runJobNow(name: string): Promise<JobExecutionResult> {
    return this.executeJob(name);
  }

  public async runAllNow(): Promise<void> {
    logger.info('[CronScheduler] Running all jobs immediately (runOnInit).');

    const promises = Array.from(this.activeJobs.keys()).map((name) =>
      this.executeJob(name).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`[CronScheduler] runAllNow failed for "${name}": ${message}`);
      }),
    );

    await Promise.allSettled(promises);
  }

  private async executeJob(name: string): Promise<JobExecutionResult> {
    const activeJob = this.activeJobs.get(name);

    if (!activeJob) {
      const errorMsg = `Job "${name}" not found in active jobs.`;
      logger.error(`[CronScheduler] ${errorMsg}`);

      return {
        jobName: name,
        success: false,
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 0,
        error: errorMsg,
      };
    }

    const { definition } = activeJob;
    const startedAt = new Date();

    logger.info(`[CronScheduler] Executing job: "${name}"`);

    let success = false;
    let errorMessage: string | undefined;
    let metadata: Record<string, unknown> | undefined;

    try {
      const output = await definition.handler();
      success = true;
      metadata = output ?? undefined;

      logger.info(
        `[CronScheduler] Job "${name}" completed successfully. metadata=${JSON.stringify(metadata)}`,
      );
    } catch (err: unknown) {
      success = false;
      errorMessage = err instanceof Error ? err.message : String(err);
      activeJob.errorCount += 1;

      logger.error(
        `[CronScheduler] Job "${name}" failed (error #${activeJob.errorCount}): ${errorMessage}`,
      );

      if (!this.options.catchExceptions) {
        throw err;
      }
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    const result: JobExecutionResult = {
      jobName: name,
      success,
      startedAt,
      finishedAt,
      durationMs,
      ...(errorMessage !== undefined && { error: errorMessage }),
      ...(metadata !== undefined && { metadata }),
    };

    activeJob.lastRun = finishedAt;
    activeJob.lastResult = result;
    activeJob.runCount += 1;

    logger.info(
      `[CronScheduler] Job "${name}" | duration: ${durationMs}ms | success: ${success}`,
    );

    return result;
  }

  public getStatus(): SchedulerStatus {
    const jobs: JobStatus[] = Array.from(this.activeJobs.entries()).map(
      ([name, activeJob]) => ({
        name,
        schedule: activeJob.definition.schedule,
        timezone: activeJob.definition.timezone ?? this.options.timezone,
        enabled: activeJob.definition.enabled ?? true,
        runCount: activeJob.runCount,
        errorCount: activeJob.errorCount,
        lastRun: activeJob.lastRun,
        lastResult: activeJob.lastResult,
      }),
    );

    return {
      isRunning: this.isRunning,
      totalJobs: jobs.length,
      jobs,
    };
  }

  public get running(): boolean {
    return this.isRunning;
  }

  public get jobCount(): number {
    return this.activeJobs.size;
  }
}

let schedulerInstance: CronScheduler | null = null;

export const getScheduler = (
  registry: JobRegistry = jobRegistry,
  options?: SchedulerOptions,
): CronScheduler => {
  if (!schedulerInstance) {
    schedulerInstance = new CronScheduler(registry, options);
  }
  return schedulerInstance;
};

export const destroyScheduler = (): void => {
  if (schedulerInstance?.running) {
    schedulerInstance.stop();
  }
  schedulerInstance = null;
};