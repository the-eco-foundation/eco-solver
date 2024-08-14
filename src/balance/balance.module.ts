import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { BalanceService } from './balance.service'
import { AlchemyModule } from '../alchemy/alchemy.module'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { BalanceWebsocketService } from './balance.ws.service'
import { EthWebsocketProcessor } from '../bullmq/processors/eth-ws.processor'

@Module({
  imports: [EcoConfigModule, AlchemyModule, initBullMQ(QUEUES.ETH_SOCKET)],
  providers: [BalanceService, BalanceWebsocketService, EthWebsocketProcessor],
  exports: [BalanceService],
})
export class BalanceModule {}
