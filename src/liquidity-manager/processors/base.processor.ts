import { Logger } from '@nestjs/common'
import { JobsOptions, MinimalQueue } from 'bullmq'
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq'
import { EcoLogMessage } from '@/common/logging/eco-log-message'
import { LiquidityManagerJob } from '@/liquidity-manager/jobs/liquidity-manager.job'
import {
  LiquidityManagerJobName,
  LiquidityManagerQueueDataType,
} from '@/liquidity-manager/queues/liquidity-manager.queue'

/**
 * Abstract class representing a base processor for liquidity manager jobs.
 * @template Job - The type of the job.
 * @template JobType - The constructor type of the job.
 */
export abstract class BaseProcessor<
  Job extends LiquidityManagerJob,
  JobType extends new (
    queue: MinimalQueue,
    name: LiquidityManagerJobName,
    data: LiquidityManagerQueueDataType,
    opts?: JobsOptions,
    id?: string,
  ) => LiquidityManagerJob = new (
    queue: MinimalQueue,
    name: LiquidityManagerJobName,
    data: LiquidityManagerQueueDataType,
    opts?: JobsOptions,
    id?: string,
  ) => LiquidityManagerJob,
> extends WorkerHost {
  public readonly logger: Logger

  /**
   * Constructs a new BaseProcessor.
   * @param name - The name of the processor.
   * @param jobs - The array of job types to process.
   */
  constructor(
    protected readonly name: string,
    protected readonly jobs: JobType[],
  ) {
    super()
    this.logger = new Logger(name)
  }

  /**
   * Processes a job.
   * @param job - The job to process.
   * @returns The result of the job execution.
   */
  process(job: Job) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `${this.name}.process()`,
        properties: {
          jobName: job.name,
        },
      }),
    )

    return this.execute(job, 'process')
  }

  /**
   * Hook triggered when a job is completed.
   * @param job - The job that was completed.
   * @returns The result of the onCompleted hook from the job type.
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    return this.execute(job, 'onComplete')
  }

  /**
   * Hook triggered when a job fails.
   * @param job - The job that failed.
   * @param error - The error that caused the job to fail.
   * @returns The result of the onFailed hook from the job type.
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    return this.execute(job, 'onFailed', error)
  }

  /**
   * Executes a method on the job type that matches the given job.
   * @param job - The job to execute the method on.
   * @param method - The method to execute.
   * @param params - Additional parameters for the method.
   * @returns The result of the method execution.
   */
  private execute(job: Job, method: unknown, ...params: unknown[]) {
    for (const jobType of this.jobs) {
      // Process the job if it matches the job type
      if ((jobType as any).is(job)) {
        return (jobType[method as any] as any)(job, this, ...params)
      }
    }

    this.logger.warn(
      EcoLogMessage.fromDefault({
        message: `${this.name}: Unknown job type`,
        properties: {
          jobName: job.name,
          method,
        },
      }),
    )

    return undefined
  }
}
