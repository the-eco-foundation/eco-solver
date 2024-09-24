import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { getTransferLogFilter } from '../common/utils/ws.helpers'
import { AlchemyEventType, Network } from 'alchemy-sdk'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { EventLogWS } from '../common/events/websocket'

@Injectable()
export class BalanceWebsocketService implements OnModuleInit {
  private logger = new Logger(BalanceWebsocketService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.ETH_SOCKET.queue) private readonly ethQueue: Queue,
    private readonly alchemyService: AlchemyService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.subscribeWS()
  }

  subscribeWS() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig

    Object.entries(this.ecoConfigService.getSolvers()).forEach((entity) => {
      const [, solver] = entity
      const instanceAddress = this.alchemyService.getWallet(solver.network).address

      Object.entries(solver.targets).forEach((targetEntity) => {
        const [address, source] = targetEntity
        if (source.contractType === 'erc20') {
          this.alchemyService
            .getAlchemy(solver.network)
            .ws.on(
              getTransferLogFilter(address, undefined, instanceAddress) as AlchemyEventType,
              this.addJob(solver.network, solver.chainID),
            )
        }
      })
    })
  }

  addJob(network: Network, chainID: number) {
    return async (event: EventLogWS) => {
      //add network to the event since alchemy doesn`t
      event.sourceNetwork = network
      event.sourceChainID = chainID
      //add to processing queue
      await this.ethQueue.add(QUEUES.ETH_SOCKET.jobs.erc20_balance_socket, event as EventLogWS, {
        jobId: event.transactionHash,
        ...this.intentJobConfig,
      })
    }
  }
}
