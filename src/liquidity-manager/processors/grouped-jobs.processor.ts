import { Logger } from '@nestjs/common'
import { LiquidityManagerJob } from '@/liquidity-manager/jobs/liquidity-manager.job'
import { BaseProcessor } from '@/liquidity-manager/processors/base.processor'
import { Queue } from 'bullmq'
import { EcoLogMessage } from '@/common/logging/eco-log-message'

/**
 * Abstract class representing a processor for grouped jobs.
 * @template Job - The type of the job.
 */
export abstract class GroupedJobsProcessor<
  Job extends LiquidityManagerJob,
> extends BaseProcessor<Job> {
  public readonly logger: Logger
  protected abstract readonly queue: Queue

  protected readonly activeGroups = new Set<string>()

  /**
   * Constructs a new GroupedJobsProcessor.
   * @param groupBy - The property to group jobs by.
   * @param params - Additional parameters for the base processor.
   */
  constructor(
    protected readonly groupBy: string,
    ...params: ConstructorParameters<typeof BaseProcessor<Job>>
  ) {
    super(...params)
  }

  /**
   * Processes a job, ensuring that jobs in the same group are not processed concurrently.
   * @param job - The job to process.
   * @returns A promise that resolves to an object indicating if the job was delayed.
   */
  async process(job: Job) {
    const group = job.data[this.groupBy] as string

    if (this.activeGroups.has(group)) {
      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: 'Job delayed due to group concurrency',
          properties: {
            jobName: job.name,
            group,
          },
        }),
      )

      await this.queue.add(job.name, job.data, {
        ...job.opts,
        delay: 5_000, // Delay for 5 seconds
      })

      return { delayed: true }
    }

    return super.process(job)
  }

  /**
   * Hook triggered when a job is completed.
   * @param job - The job that was completed.
   * @returns The result of the onCompleted hook from the base processor.
   */
  onCompleted(job: Job): any {
    const returnvalue = job.returnvalue as object
    if ('delayed' in returnvalue && returnvalue.delayed) {
      // Skip onCompleted hook if job got delayed
      return
    }

    return super.onCompleted(job)
  }
}
