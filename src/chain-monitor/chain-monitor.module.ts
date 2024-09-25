import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { IntentModule } from '../intent/intent.module'
import { ChainSyncService } from './chain-sync.service'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [EcoConfigModule, IntentModule, TransactionModule],
  providers: [ChainSyncService],
  exports: [ChainSyncService],
})
export class ChainMonitorModule {}
