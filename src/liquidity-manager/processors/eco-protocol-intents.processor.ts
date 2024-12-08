import { Injectable } from '@nestjs/common'
import { InjectQueue, Processor } from '@nestjs/bullmq'
import { LiquidityManagerJob } from '@/liquidity-manager/jobs/liquidity-manager.job'
import { CheckBalancesCronJob } from '@/liquidity-manager/jobs/check-balances-cron.job'
import { RebalanceJob } from '@/liquidity-manager/jobs/rebalance.job'
import {
  LiquidityManagerQueue,
  LiquidityManagerQueueType,
} from '@/liquidity-manager/queues/liquidity-manager.queue'
import { LiquidityManagerService } from '@/liquidity-manager/services/liquidity-manager.service'
import { BaseProcessor } from '@/liquidity-manager/processors/base.processor'

/**
 * Processor for handling liquidity manager jobs.
 * Extends the GroupedJobsProcessor to ensure jobs in the same group are not processed concurrently.
 */
@Injectable()
@Processor(LiquidityManagerQueue.queueName)
export class LiquidityManagerProcessor extends BaseProcessor<LiquidityManagerJob> {
  /**
   * Constructs a new LiquidityManagerProcessor.
   * @param queue - The queue to process jobs from.
   * @param liquidityManagerService - The service for managing liquidity.
   */
  constructor(
    @InjectQueue(LiquidityManagerQueue.queueName)
    protected readonly queue: LiquidityManagerQueueType,
    public readonly liquidityManagerService: LiquidityManagerService,
  ) {
    super(LiquidityManagerProcessor.name, [CheckBalancesCronJob, RebalanceJob])
  }
}
