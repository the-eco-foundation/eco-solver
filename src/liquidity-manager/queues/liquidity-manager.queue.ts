import { Queue } from 'bullmq'
import { initBullMQ } from '@/bullmq/bullmq.helper'
import { CheckBalancesCronJob } from '@/liquidity-manager/jobs/check-balances-cron.job'

export enum LiquidityManagerJobName {
  CHECK_BALANCES = 'CHECK_BALANCES',
}

export type LiquidityManagerQueueDataType = { network: string; [k: string]: unknown }

export class LiquidityManagerQueue extends Queue<
  LiquidityManagerQueueDataType,
  unknown,
  LiquidityManagerJobName
> {
  public static readonly queueName = LiquidityManagerQueue.name

  static init() {
    return initBullMQ({ queue: this.queueName, prefix: '{liquidity-manager}' })
  }

  startCronJobs() {
    CheckBalancesCronJob.start(this)
  }
}
