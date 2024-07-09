import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as config from 'config'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { ConfigSource } from './interfaces/config-source.interface'
import { EcoConfigType } from './eco-config.types'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class EcoConfigService implements OnModuleInit {
  private logger = new Logger(EcoConfigService.name)
  private externalConfigs: any
  private ecoConfig: config.IConfig

  constructor(private readonly configSource: ConfigSource) {
    this.externalConfigs = configSource.getConfig()
    this.ecoConfig = config
  }

  async onModuleInit() {
    this.initConfigs()
  }

  // Initialize the configs
  initConfigs() {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `Initializing eco configs`,
      }),
    )
    // Merge the secrets with the existing config, the local configs here on the right
    // means that they will be overwritten by the secrets on the left(aws) if they both exist
    this.ecoConfig = config.util.extendDeep(this.externalConfigs, this.ecoConfig)
  }

  // Generic getter for key/val of config object
  get<T>(key: string): T {
    return this.ecoConfig.get<T>(key)
  }

  // Returns the eth configs
  getEth(): EcoConfigType['eth'] {
    return this.ecoConfig.get('eth')
  }

  // Returns the server configs
  getServer(): EcoConfigType['server'] {
    return this.ecoConfig.get('server')
  }
}
