import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'

/**
 * Service class for solving an intent on chain. It starts up and subscribes to
 * the events for prover contracts. When it receives an event, it process it if it
 * is validated and profitable.
 */
@Injectable()
export class SolverService implements OnModuleInit {
  private logger = new Logger(SolverService.name)

  constructor(private readonly alchemyService: AlchemyService) {}

  onModuleInit() {}
}
