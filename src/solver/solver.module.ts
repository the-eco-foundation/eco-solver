import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { ValidSmartWalletService } from './filters/valid-smart-wallet.service'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [EcoConfigModule, TransactionModule],
  providers: [ValidSmartWalletService],
  exports: [ValidSmartWalletService],
})
export class SolverModule {}
