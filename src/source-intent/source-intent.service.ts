import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'

/**
 * Service class for solving an intent on chain
 */
@Injectable()
export class SoucerIntentService implements OnModuleInit {
  private logger = new Logger(SoucerIntentService.name)

  constructor(private readonly alchemyService: AlchemyService) {}

  onModuleInit() {}
}
