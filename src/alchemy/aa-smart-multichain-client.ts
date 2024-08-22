import {
  baseSepolia,
  chains,
  createSmartAccountClient,
  LocalAccountSigner,
  optimismSepolia,
  SmartAccountClient,
  SmartAccountClientConfig,
  SmartAccountSigner,
} from '@alchemy/aa-core'
import { extractChain, http } from 'viem'
import { EcoError } from '../common/errors/eco-error'
import { Logger } from '@nestjs/common'
import { ChainsSupported } from '../common/utils/chains'
import { createMultiOwnerModularAccount, CreateMultiOwnerModularAccountParams } from '@alchemy/aa-accounts'
import { getAchemyRPCUrl } from '../common/utils/strings'
import { AAMultiChainConfig } from './aa-smart-multichain.service'
// import * as chains from 'viem/chains'


// export const chain: Chain = sepolia

// export const smartAccountClient = await createModularAccountAlchemyClient({
//   apiKey: "YOUR_API_KEY",
//   chain
//   signer: LocalAccountSigner.privateKeyToAccountSigner("OWNER_MNEMONIC"),
// })


// const rpcTransport = http("https://polygon-mumbai.g.alchemy.com/v2/demo");

// export const smartAccountClient = createSmartAccountClient({
//   transport: rpcTransport,
//   chain,
//   account: await createMultiOwnerModularAccount({
//     transport: rpcTransport,
//     chain,
//     signer,
//   }),
// });
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
      id: chainID 
    }) as chains.Chain

    // const c = Object.values(aaChains)[0]
    if (this.configs && this.configs.ids.includes(chainID) && chain) {
      const rpcTransport = http(getAchemyRPCUrl(chain, this.configs.apiKey))
      return {
        transport: rpcTransport as any,
        chain: chain,
        account: await createMultiOwnerModularAccount({
          transport: rpcTransport as any,
          chain,
          signer: this.configs.signer,
        })
        
      }
    } else {
      throw EcoError.AlchemyUnsupportedChainError(chain[0])
    }
    // const a = optimismSepolia
    // const rpcTransport = http(optimismSepolia.rpcUrls.alchemy.http[0] + "/HM-SyEOQiSwHzZbSy5XfuCLlHF2ddktQ")
    // const key = "1fbe1b36ac368b3e6b021bf799dde2893d6e17439f2a198ca41e0acdb0fae831"
    // const signer: SmartAccountSigner = LocalAccountSigner.privateKeyToAccountSigner(`0x${key}`)

    // transport: rpcTransport as any,
    //   chain: optimismSepolia,
    //     account: await createMultiOwnerModularAccount({
    //       transport: rpcTransport as any,
    //       chain: optimismSepolia,
    //       signer,
    //     })
  }
}
