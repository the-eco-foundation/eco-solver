import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { LiquidityManagerQueue } from '@/liquidity-manager/queues/liquidity-manager.queue'

@Injectable()
export class LiquidityManagerService implements OnApplicationBootstrap {
  constructor(
    @InjectQueue(LiquidityManagerQueue.queueName)
    private readonly queue: LiquidityManagerQueue,
  ) {}

  onApplicationBootstrap() {
    this.queue.startCronJobs()
  }

  getTokenThreshold() {
    // This function should return tokens under their threshold
  }
}
