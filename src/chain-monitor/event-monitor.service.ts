import { Injectable, Logger, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'

@Injectable()
export class EventMonitorService implements OnModuleInit, OnApplicationBootstrap {
  private logger = new Logger(EventMonitorService.name)

  constructor(private ecoConfigService: EcoConfigService) {}

  async onModuleInit() {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `ChainMonitorService: onModuleInit`,
      }),
    )
  }

  async onApplicationBootstrap() {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `ChainMonitorService: onApplicationBootstrap`,
      }),
    )
  }
}
