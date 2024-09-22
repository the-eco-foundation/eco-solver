import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { TransactionExecutorService } from './transaction-executor.service'

@Module({
  imports: [EcoConfigModule],
  providers: [TransactionExecutorService],
  exports: [],
})
export class TransactionExecutorModule {}
