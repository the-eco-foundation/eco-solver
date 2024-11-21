import { Queue } from 'bullmq'
import { LiquidityManagerJob } from '@/liquidity-manager/jobs/liquidity-manager.job'
import { LiquidityManagerJobName } from '@/liquidity-manager/queues/liquidity-manager.queue'
import { LiquidityManagerProcessor } from '@/liquidity-manager/processors/eco-protocol-intents.processor'

export class CheckBalancesCronJob extends LiquidityManagerJob {
  static is(job: LiquidityManagerJob): job is CheckBalancesCronJob {
    return job.name === LiquidityManagerJobName.CHECK_BALANCES
  }

  static async process(
    job: CheckBalancesCronJob,
    processor: LiquidityManagerProcessor,
  ): Promise<void> {
    const offBalanaces = await processor.liquidityManagerService.getTokenUnderThreshold()
  }

  static start(queue: Queue) {
    queue.add(CheckBalancesCronJob.name, undefined, {
      jobId: CheckBalancesCronJob.name,
      removeOnComplete: true,
      repeat: {
        every: 300_000, // every 5 minutes
      },
    })
  }
}
