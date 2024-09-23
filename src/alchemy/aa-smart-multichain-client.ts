import {
  createSmartAccountClient,
  SmartAccountClient,
  SmartAccountClientConfig,
} from '@alchemy/aa-core'
import { extractChain } from 'viem'
import { EcoError } from '../common/errors/eco-error'
import { ChainsSupported } from '../common/utils/chains'
import { createMultiOwnerModularAccount } from '@alchemy/aa-accounts'
import { AAMultiChainConfig } from './aa-smart-multichain.service'
import { getTransport } from './utils'

export class AASmartMultichainClient {
  readonly configs: AAMultiChainConfig
  readonly instances: Map<number, SmartAccountClient> = new Map()
  constructor(configs: AAMultiChainConfig) {
    this.configs = configs
  }

  async clientForChain(chainID: number): Promise<SmartAccountClient> {
    return await this.loadInstance(chainID)
  }

  async loadInstance(chainID: number): Promise<SmartAccountClient> {
    if (!this.instances.has(chainID)) {
      const client = createSmartAccountClient(await this.getSettings(chainID))
      this.instances.set(chainID, client)
    }
    return this.instances.get(chainID)
  }
  /**
   * Use overrides if they exist -- otherwise use the default settings.
   * @param chain
   * @returns
   */
  private async getSettings(chainID: number): Promise<SmartAccountClientConfig> {
    const chain = extractChain({
      chains: ChainsSupported,
      id: chainID,
    })

    // const c = Object.values(aaChains)[0]
    if (this.configs && this.configs.ids.includes(chainID) && chain) {
      const rpcTransport = getTransport(chain, this.configs.apiKey, true)
      return {
        transport: rpcTransport as any,
        // @ts-expect-error -- this is a valid chain
        chain: chain,
        account: await createMultiOwnerModularAccount({
          transport: rpcTransport as any,
          // @ts-expect-error -- this is a valid chain
          chain,
          signer: this.configs.signer,
        }),
      }
    } else {
      throw EcoError.AlchemyUnsupportedChainError(chain[0])
    }
  }
}
