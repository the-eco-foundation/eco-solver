import { Job } from 'bullmq'
import {
  LiquidityManagerQueueDataType,
  LiquidityManagerJobName,
} from '@/liquidity-manager/queues/liquidity-manager.queue'

export abstract class LiquidityManagerJob<
  NameType extends LiquidityManagerJobName = LiquidityManagerJobName,
  DataType extends LiquidityManagerQueueDataType = LiquidityManagerQueueDataType,
> extends Job<DataType, unknown, NameType> {
  /**
   * Checks if the given job is of the specific type.
   * @param job - The job to check.
   * @returns A boolean indicating if the job is of the specific type.
   */
  static is(job: LiquidityManagerJob): boolean {
    throw new Error('Unimplemented function')
  }

  /**
   * Processes the given job.
   * @param job - The job to process.
   * @param processor - The processor handling the job.
   */
  static process(job: LiquidityManagerJob, processor: unknown): Promise<void> {
    throw new Error('Unimplemented function')
  }

  /**
   * Hook triggered when a job is completed.
   * @param job - The job to process.
   * @param processor - The processor handling the job.
   */
  static onComplete(job: LiquidityManagerJob, processor: unknown): void {
    // Placeholder method implementation
  }

  /**
   * Hook triggered when a job fails.
   * @param job - The job to process.
   * @param processor - The processor handling the job.
   */
  static onFailed(job: LiquidityManagerJob, processor: unknown, error: unknown): void {
    // Placeholder method implementation
  }
}
