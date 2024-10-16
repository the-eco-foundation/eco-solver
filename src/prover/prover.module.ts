import { Module } from '@nestjs/common'
import { ProofService } from './proof.service'
import { TransactionModule } from '../transaction/transaction.module'
import { EcoConfigModule } from '../eco-configs/eco-config.module'

@Module({
  imports: [TransactionModule, EcoConfigModule],
  providers: [ProofService],
  exports: [ProofService],
})
export class ProverModule {}
