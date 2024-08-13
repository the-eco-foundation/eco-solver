import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class BalanceService implements OnModuleInit {
  private logger = new Logger(BalanceService.name)

  constructor(private readonly ecoConfig: EcoConfigService) {}

  async onModuleInit() {
    // this.ecoConfig.getSolvers().forEach((solver) => {
  }
}
