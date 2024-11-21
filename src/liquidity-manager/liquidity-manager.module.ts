import { Module } from '@nestjs/common'
import { LiquidityManagerQueue } from '@/liquidity-manager/queues/liquidity-manager.queue'
import { LiquidityManagerService } from '@/liquidity-manager/services/liquidity-manager.service'
import { LiquidityManagerProcessor } from '@/liquidity-manager/processors/eco-protocol-intents.processor'

@Module({
  imports: [LiquidityManagerQueue.init()],
  providers: [LiquidityManagerService, LiquidityManagerProcessor],
  exports: [],
})
export class LiquidityManagerModule {}
