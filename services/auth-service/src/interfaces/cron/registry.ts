import cron, { ScheduledTask } from 'node-cron';

interface JobMetadata {
  name: string;
  cron: string;
  description: string;
  lastRun?: Date;
  nextRun?: Date;
  status: 'scheduled' | 'running' | 'idle' | 'failed';
  task?: ScheduledTask;
}

class JobRegistry {
  private jobs: Map<string, JobMetadata> = new Map();

  register(name: string, cronExpression: string, description: string, task: ScheduledTask): void {
    this.jobs.set(name, {
      name,
      cron: cronExpression,
      description,
      status: 'scheduled',
      task,
    });
  }

  markRunning(name: string): void {
    const job = this.jobs.get(name);
    if (job !== undefined) {
      job.status = 'running';
      job.lastRun = new Date();
    }
  }

  markCompleted(name: string): void {
    const job = this.jobs.get(name);
    if (job !== undefined) {
      job.status = 'idle';
    }
  }

  markFailed(name: string): void {
    const job = this.jobs.get(name);
    if (job !== undefined) {
      job.status = 'failed';
    }
  }

  getJob(name: string): JobMetadata | undefined {
    return this.jobs.get(name);
  }

  getAllJobs(): Omit<JobMetadata, 'task'>[] {
    return Array.from(this.jobs.values()).map((job) => ({
      name: job.name,
      cron: job.cron,
      description: job.description,
      status: job.status,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
    }));
  }

  stopJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job?.task !== undefined) {
      job.task.stop();
      job.status = 'idle';
      return true;
    }
    return false;
  }

  startJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job?.task !== undefined) {
      job.task.start();
      job.status = 'scheduled';
      return true;
    }
    return false;
  }

  stopAll(): void {
    for (const job of this.jobs.values()) {
      if (job.task !== undefined) {
        job.task.stop();
        job.status = 'idle';
      }
    }
  }
}

export { cron };
export const jobRegistry = new JobRegistry();