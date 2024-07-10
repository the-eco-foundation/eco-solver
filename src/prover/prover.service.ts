import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'

/**
 * Service class for solving an intent on chain
 */
@Injectable()
export class ProverService implements OnModuleInit {
  private logger = new Logger(ProverService.name)

  constructor(private readonly alchemyService: AlchemyService) {}

  onModuleInit() {}
}
