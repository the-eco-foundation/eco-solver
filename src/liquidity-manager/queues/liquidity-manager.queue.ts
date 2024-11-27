import { Queue } from 'bullmq'
import { initBullMQ, initFlowBullMQ } from '@/bullmq/bullmq.helper'
import { CheckBalancesCronJob } from '@/liquidity-manager/jobs/check-balances-cron.job'

export enum LiquidityManagerJobName {
  CHECK_BALANCES = 'CHECK_BALANCES',
}

export type LiquidityManagerQueueDataType = { network: string; [k: string]: unknown }

export type LiquidityManagerQueueType = Queue<
  LiquidityManagerQueueDataType,
  unknown,
  LiquidityManagerJobName
>

export class LiquidityManagerQueue {
  public static readonly queueName = LiquidityManagerQueue.name
  public static readonly flowName = `flow-liquidity-manager`

  constructor(private readonly queue: LiquidityManagerQueueType) {}

  static init() {
    return initBullMQ({ queue: this.queueName, prefix: '{liquidity-manager}' })
  }

  static initFlow() {
    return initFlowBullMQ({ queue: this.flowName, prefix: '{flow-liquidity-manager}' })
  }

  startCronJobs() {
    return CheckBalancesCronJob.start(this.queue)
  }
}
