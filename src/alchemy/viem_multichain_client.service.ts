import { Injectable, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { chains } from '@alchemy/aa-core'
import { createClient, extractChain } from 'viem'
import { EcoError } from '../common/errors/eco-error'
import { ChainsSupported } from '../common/utils/chains'
import { getTransport } from './utils'

@Injectable()
export class ViemMultichainClientService<T, V> implements OnModuleInit {
  readonly instances: Map<number, T> = new Map()

  protected supportedChainIds: number[] = []
  protected apiKey: string
  constructor(readonly ecoConfigService: EcoConfigService) {}
  onModuleInit() {
    this.setChainConfigs()
  }

  get supportedNetworks(): ReadonlyArray<number> {
    return this.supportedChainIds
  }

  async getClient(id: number): Promise<T> {
    if (!this.supportedNetworks.includes(id)) {
      throw EcoError.AlchemyUnsupportedNetworkIDError(id)
    }
    return await this.clientForChain(id)
  }

  private async clientForChain(chainID: number): Promise<T> {
    return await this.loadInstance(chainID)
  }

  private setChainConfigs() {
    const alchemyConfigs = this.ecoConfigService.getAlchemy()
    this.supportedChainIds = alchemyConfigs.networks.map((n) => n.id)
    this.apiKey = alchemyConfigs.apiKey
  }

  private async loadInstance(chainID: number): Promise<T> {
    if (!this.instances.has(chainID)) {
      const client = await this.createInstanceClient(await this.getChainConfig(chainID))
      this.instances.set(chainID, client)
    }
    return this.instances.get(chainID)
  }

  protected async createInstanceClient(configs: V): Promise<T> {
    //@ts-expect-error client mismatch on property definition
    return createClient(configs)
  }

  /**
   * Use overrides if they exist -- otherwise use the default settings.
   * @param chain
   * @returns
   */
  private async getChainConfig(chainID: number): Promise<V> {
    const chain = extractChain({
      chains: ChainsSupported,
      id: chainID,
    }) as chains.Chain

    if (this.supportedChainIds.includes(chainID) && chain) {
      return await this.buildChainConfig(chain)
    } else {
      throw EcoError.AlchemyUnsupportedChainError(chain[0])
    }
  }

  protected async buildChainConfig(chain: chains.Chain): Promise<V> {
    const rpcTransport = getTransport(chain, this.apiKey, true)
    return {
      transport: rpcTransport,
      chain: chain,
    } as V
  }
}
