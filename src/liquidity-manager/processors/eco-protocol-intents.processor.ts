import { Injectable } from '@nestjs/common'
import { InjectQueue, Processor } from '@nestjs/bullmq'
import { LiquidityManagerJob } from '@/liquidity-manager/jobs/liquidity-manager.job'
import { CheckBalancesCronJob } from '@/liquidity-manager/jobs/check-balances-cron.job'
import { GroupedJobsProcessor } from '@/liquidity-manager/processors/grouped-jobs.processor'
import { LiquidityManagerQueue } from '@/liquidity-manager/queues/liquidity-manager.queue'
import { LiquidityManagerService } from '@/liquidity-manager/services/liquidity-manager.service'

/**
 * Processor for handling liquidity manager jobs.
 * Extends the GroupedJobsProcessor to ensure jobs in the same group are not processed concurrently.
 */
@Injectable()
@Processor(LiquidityManagerQueue.queueName)
export class LiquidityManagerProcessor extends GroupedJobsProcessor<LiquidityManagerJob> {
  /**
   * Constructs a new LiquidityManagerProcessor.
   * @param queue - The queue to process jobs from.
   * @param liquidityManagerService - The service for managing liquidity.
   */
  constructor(
    @InjectQueue(LiquidityManagerQueue.queueName)
    protected readonly queue: LiquidityManagerQueue,
    public readonly liquidityManagerService: LiquidityManagerService,
  ) {
    super('network', LiquidityManagerProcessor.name, [CheckBalancesCronJob])
  }
}
