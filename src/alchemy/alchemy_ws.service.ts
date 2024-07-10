import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates websockets for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class AlchemyWsService implements OnModuleInit {
  private logger = new Logger(AlchemyWsService.name)

  constructor(private readonly alchemyService: AlchemyService) {
    // alchemyService.supportedNetworks.forEach((network) => {
    //   alchemyService.getAlchemy(network).ws.on('newPendingTransactions', (tx) => {})
    // })
  }

  onModuleInit() {}
}
