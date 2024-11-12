import { Module } from '@nestjs/common'
import { FlagsService } from './flags.service'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [TransactionModule],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
