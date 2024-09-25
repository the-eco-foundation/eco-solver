import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { BalanceService } from './balance.service'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { BalanceWebsocketService } from './balance.ws.service'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [EcoConfigModule, TransactionModule, initBullMQ(QUEUES.ETH_SOCKET)],
  providers: [BalanceService, BalanceWebsocketService],
  exports: [BalanceService],
})
export class BalanceModule {}
