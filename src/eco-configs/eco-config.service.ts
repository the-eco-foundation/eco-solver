import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as config from 'config'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { ConfigSource } from './interfaces/config-source.interface'
import { EcoConfigType, Solver, IntentSource } from './eco-config.types'
import { entries, keys } from 'lodash'
import { getAddress } from 'viem'
import { addressKeys } from '../common/viem/utils'
import { getChainConfig } from './utils'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class EcoConfigService implements OnModuleInit {
  private logger = new Logger(EcoConfigService.name)
  private externalConfigs: any = {}
  private ecoConfig: config.IConfig

  constructor(private readonly sources: ConfigSource[]) {
    this.sources.reduce((prev, curr) => {
      return config.util.extendDeep(prev, curr.getConfig())
    }, this.externalConfigs)

    this.ecoConfig = config
    this.initConfigs()
  }

  async onModuleInit() {}

  /**
   * Returns the static configs  for the app, from the 'config' package
   * @returns the configs
   */
  static getStaticConfig(): EcoConfigType {
    return config as unknown as EcoConfigType
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

  // Returns the alchemy configs
  getAlchemy(): EcoConfigType['alchemy'] {
    const a = this.ecoConfig.get('solvers')
    keys(a).forEach((k) => {
      a[k]
    })
    return this.ecoConfig.get('alchemy')
  }

  // Returns the source intents config
  getIntentSources(): EcoConfigType['intentSources'] {
    const intents = this.ecoConfig.get('intentSources').map((intent: IntentSource) => {
      intent.tokens = intent.tokens.map((token: string) => {
        return getAddress(token)
      })
      const config = getChainConfig(intent.chainID)
      intent.sourceAddress = config.IntentSource
      intent.provers = [config.Prover, config.HyperProver]
      return intent
    })
    return intents
  }

  // Returns the solvers config
  getSolvers(): EcoConfigType['solvers'] {
    const solvers = this.ecoConfig.get('solvers')
    entries(solvers).forEach(([, solver]: [string, Solver]) => {
      const config = getChainConfig(solver.chainID)
      solver.solverAddress = config.Inbox
      solver.targets = addressKeys(solver.targets) ?? {}
    })
    return solvers
  }

  // Returns the solver for a specific chain or undefined if its not supported
  getSolver(chainID: number | bigint): Solver | undefined {
    chainID = typeof chainID === 'bigint' ? Number(chainID) : chainID
    return this.getSolvers()[chainID]
  }

  // Get the launch darkly configs
  getLaunchDarkly(): EcoConfigType['launchDarkly'] {
    return this.ecoConfig.get('launchDarkly')
  }

  getDatabaseConfig(): EcoConfigType['database'] {
    return this.ecoConfig.get('database')
  }

  // Returns the eth configs
  getEth(): EcoConfigType['eth'] {
    return this.ecoConfig.get('eth')
  }

  // Returns the external APIs config
  getExternalAPIs(): EcoConfigType['externalAPIs'] {
    return this.ecoConfig.get('externalAPIs')
  }

  getLoggerConfig(): EcoConfigType['logger'] {
    return this.ecoConfig.get('logger')
  }

  getMongooseUri() {
    const config = this.getDatabaseConfig()
    return config.auth.enabled
      ? `${config.uriPrefix}${config.auth.username}:${config.auth.password}@${config.uri}/${config.dbName}`
      : `${config.uriPrefix}${config.uri}/${config.dbName}`
  }

  // Returns the redis configs
  getRedis(): EcoConfigType['redis'] {
    return this.ecoConfig.get('redis')
  }

  // Returns the server configs
  getServer(): EcoConfigType['server'] {
    return this.ecoConfig.get('server')
  }
}
