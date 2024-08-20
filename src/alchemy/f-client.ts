import { createSmartAccountClient, LocalAccountSigner, SmartAccountClient, SmartAccountClientConfig } from '@alchemy/aa-core'
import { extractChain } from 'viem'
import { EcoError } from '../common/errors/eco-error'
import { Logger } from '@nestjs/common'
import * as chains from 'viem/chains'


// export const chain: Chain = sepolia

// export const smartAccountClient = await createModularAccountAlchemyClient({
//   apiKey: "YOUR_API_KEY",
//   chain
//   signer: LocalAccountSigner.privateKeyToAccountSigner("OWNER_MNEMONIC"),
// })
export class FClient {
  readonly settings: Record<number, SmartAccountClientConfig>
  readonly instances: Map<number, SmartAccountClient> = new Map()
  constructor(
    settings: Record<string, SmartAccountClientConfig>,
  ) {
    this.settings = settings
    this.getSettings(1)
  }

  async loadInstance(chainID: number) {
    const client = await createSmartAccountClient({
      ...this.getSettings(chainID),
    })
  }
    /**
   * Use overrides if they exist -- otherwise use the default settings.
   * @param chain
   * @returns
   */
    private getSettings(chainID: number): SmartAccountClientConfig {
      const chain = extractChain({
        chains: Object.values(chains),
        id: chainID as any,
      })
      if (this.settings && this.settings[chainID] && chain) {
        // const chain1: Chain = sepolia
        return { ...this.settings[chainID], chain: chain[0] }
      } else {
        throw EcoError.AlchemyUnsupportedChainError(chain[0])
      }
    }


}