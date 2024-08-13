import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { BalanceService } from './balance.service'

@Module({
  imports: [EcoConfigModule],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
