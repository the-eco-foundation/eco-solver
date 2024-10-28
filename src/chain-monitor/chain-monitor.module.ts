import { Module } from '@nestjs/common'
import { IntentModule } from '../intent/intent.module'
import { ChainSyncService } from './chain-sync.service'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [IntentModule, TransactionModule],
  providers: [ChainSyncService],
  exports: [ChainSyncService],
})
export class ChainMonitorModule {}
