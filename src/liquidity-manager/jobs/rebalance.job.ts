import { FlowChildJob } from 'bullmq'
import { EcoLogMessage } from '@/common/logging/eco-log-message'
import { LiquidityManagerJob } from '@/liquidity-manager/jobs/liquidity-manager.job'
import { LiquidityManagerJobName } from '@/liquidity-manager/queues/liquidity-manager.queue'
import { LiquidityManagerProcessor } from '@/liquidity-manager/processors/eco-protocol-intents.processor'
import { serialize, Serialize } from '@/liquidity-manager/utils/serialize'

export type RebalanceJobData = {
  network: string
  rebalance: Serialize<LiquidityManager.RebalanceRequest>
}

export class RebalanceJob extends LiquidityManagerJob<
  LiquidityManagerJobName.REBALANCE,
  RebalanceJobData
> {
  /**
   * Type guard to check if the given job is an instance of RebalanceJob.
   * @param job - The job to check.
   * @returns True if the job is a RebalanceJob.
   */
  static is(job: LiquidityManagerJob): job is RebalanceJob {
    return job.name === LiquidityManagerJobName.REBALANCE
  }

  static createJob(rebalance: LiquidityManager.RebalanceRequest, queueName: string): FlowChildJob {
    const data: RebalanceJobData = {
      network: rebalance.token.config.chainId.toString(),
      rebalance: serialize(rebalance),
    }
    return {
      queueName,
      data,
      name: LiquidityManagerJobName.REBALANCE,
    }
  }

  static async process(job: RebalanceJob, processor: LiquidityManagerProcessor): Promise<void> {
    return processor.liquidityManagerService.executeRebalancing(job.data)
  }

  /**
   * Handles job failures by logging the error.
   * @param job - The job that failed.
   * @param processor - The processor handling the job.
   * @param error - The error that occurred.
   */
  static onFailed(job: LiquidityManagerJob, processor: LiquidityManagerProcessor, error: Error) {
    processor.logger.error(
      EcoLogMessage.fromDefault({
        message: `RebalanceJob: Failed`,
        properties: { error: error.message },
      }),
    )
  }
}
