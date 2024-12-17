import { Module } from '@nestjs/common'
import { BalanceModule } from '@/balance/balance.module'
import { TransactionModule } from '@/transaction/transaction.module'
import { LiquidityManagerQueue } from '@/liquidity-manager/queues/liquidity-manager.queue'
import { LiquidityManagerService } from '@/liquidity-manager/services/liquidity-manager.service'
import { LiquidityManagerProcessor } from '@/liquidity-manager/processors/eco-protocol-intents.processor'
import { LiquidityProviderManagerService } from '@/liquidity-manager/services/liquidity-provider-manager.service'
import { LiFiProviderService } from '@/liquidity-manager/services/liquidity-providers/LiFi/lifi-provider.service'

@Module({
  imports: [
    BalanceModule,
    TransactionModule,
    LiquidityManagerQueue.init(),
    LiquidityManagerQueue.initFlow(),
  ],
  providers: [
    LiquidityManagerService,
    LiquidityManagerProcessor,
    LiquidityProviderManagerService,
    LiFiProviderService,
  ],
  exports: [],
})
export class LiquidityManagerModule {}
