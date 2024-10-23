import { Injectable, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { Chain, Client, ClientConfig, createClient, extractChain } from 'viem'
import { EcoError } from '../common/errors/eco-error'
import { ChainsSupported } from '../common/chains/supported'
import { getTransport } from '../common/chains/transport'

@Injectable()
export class ViemMultichainClientService<T extends Client, V extends ClientConfig>
  implements OnModuleInit
{
  readonly instances: Map<number, T> = new Map()

  protected supportedChainIds: number[] = []
  protected apiKey: string
  protected pollingInterval: number

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
    return await this.clientForChain(id)!
  }

  private async clientForChain(chainID: number): Promise<T> {
    return await this.loadInstance(chainID)!
  }

  private setChainConfigs() {
    const alchemyConfigs = this.ecoConfigService.getAlchemy()
    this.supportedChainIds = alchemyConfigs.networks.map((n) => n.id)
    this.apiKey = alchemyConfigs.apiKey
    this.pollingInterval = this.ecoConfigService.getEth().pollingInterval
  }

  private async loadInstance(chainID: number): Promise<T> {
    if (!this.instances.has(chainID)) {
      const client = await this.createInstanceClient(await this.getChainConfig(chainID))
      this.instances.set(chainID, client)
    }
    return this.instances.get(chainID)!
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
    })

    if (this.supportedChainIds.includes(chainID) && chain) {
      return await this.buildChainConfig(chain)
    } else {
      throw EcoError.UnsupportedChainError(chain[0])
    }
  }

  protected async buildChainConfig(chain: Chain): Promise<V> {
    const rpcTransport = getTransport(chain, this.apiKey)
    return {
      transport: rpcTransport,
      chain: chain,
      pollingInterval: this.pollingInterval,
    } as V
  }
}
