import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { TransactionExecutorService } from './transaction-executor.service'

@Module({
  imports: [EcoConfigModule, SignModule],
  providers: [TransactionExecutorService],
  exports: [TransactionExecutorService],
})
export class TransactionExecutorModule {}
