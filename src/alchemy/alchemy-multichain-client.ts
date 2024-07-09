//From https://github.com/alchemyplatform/alchemy-multichain-demo/blob/main/src/alchemy-multichain-client.ts
import { Alchemy, AlchemySettings, Network } from 'alchemy-sdk'
import * as ethers from 'ethers'
import { Logger } from '@nestjs/common'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EcoError } from '../common/errors/eco-error'
import { alchemyToEthers } from '../ethers/ether.helper'

/**
 * This is a wrapper around the Alchemy class that allows you to use the same
 * Alchemy object to make requests to multiple networks using different
 * settings.
 *
 * When instantiating this class, you can pass in an `AlchemyMultiChainSettings`
 * object to apply the same settings to all networks. You can also pass in an
 * optional `overrides` object to apply different settings to specific
 * networks.
 */
export class AlchemyMultichainClient {
  private logger = new Logger(AlchemyMultichainClient.name)
  readonly settings: AlchemyMultichainSettings
  readonly overrides: Partial<Record<Network, AlchemyMultichainSettings>>
  /**
   * Lazy-loaded mapping of `Network` enum to `Alchemy` instance.
   *
   * @private
   */
  private readonly instances: Map<Network, Alchemy> = new Map()

  /**
   * Lazy-loaded mapping of `Network` enum to `AlchemyProvider` instance.
   *
   * @private
   */
  private readonly providers: Map<Network, ethers.AlchemyProvider> = new Map()

  /**
   * @param settings The settings to use for all networks.
   * @param overrides Optional settings to use for specific networks.
   */
  constructor(
    settings: AlchemyMultichainSettings,
    overrides?: Partial<Record<Network, AlchemyMultichainSettings>>,
  ) {
    this.settings = settings
    this.overrides = overrides
  }

  /**
   * Returns an instance of `Alchemy` for the given `Network`.
   *
   * @param network
   */
  forNetwork(network: Network): Alchemy {
    return this.loadInstance(network)
  }

  providerForNetwork(network: Network): ethers.AlchemyProvider {
    return this.loadProvider(network)
  }

  /**
   * Returns an instance of `InfuraProvider` for the given `Network`.
   *
   * @param network
   */
  private loadProvider(network: Network): ethers.AlchemyProvider {
    if (!this.providers.has(network)) {
      // Use overrides if they exist -- otherwise use the default settings.
      const providerSettings = this.getSettings(network)
      //need to convert these to ethers network names or it will throw an error
      const ethersNetwork = alchemyToEthers(providerSettings.network)
      try {
        const provider = new ethers.AlchemyProvider(ethersNetwork.name, providerSettings.apiKey)
        this.providers.set(network, provider)
      } catch (e) {
        this.logger.error(
          EcoLogMessage.withError({
            message: `loadProvider`,
            error: EcoError.AlchemyServiceProviderError(ethersNetwork.name),
            properties: {
              errorMessage: EcoError.getErrorMessage(e),
              network: ethersNetwork.name,
            },
          }),
          e.stack,
        )
      }
    }
    return this.providers.get(network)
  }

  /**
   * Checks if an instance of `Alchemy` exists for the given `Network`. If not,
   * it creates one and stores it in the `instances` map.
   *
   * @private
   * @param network
   */
  private loadInstance(network: Network): Alchemy {
    if (!this.instances.has(network)) {
      // Use overrides if they exist -- otherwise use the default settings.
      const alchemySettings = this.getSettings(network)
      this.instances.set(network, new Alchemy(alchemySettings))
    }
    return this.instances.get(network)
  }

  /**
   * Use overrides if they exist -- otherwise use the default settings.
   * @param network
   * @returns
   */
  private getSettings(network: Network): AlchemySettings {
    return this.overrides && this.overrides[network]
      ? { ...this.overrides[network], network }
      : { ...this.settings, network }
  }
}

/** AlchemySettings with the `network` param omitted in order to avoid confusion. */
export type AlchemyMultichainSettings = Omit<AlchemySettings, 'network'>
