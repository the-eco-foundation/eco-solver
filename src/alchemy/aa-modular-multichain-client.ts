import { AlchemyModularAccountClientConfig, AlchemySmartAccountClient, createModularAccountAlchemyClient } from "@alchemy/aa-alchemy"
import { LocalAccountSigner, sepolia, } from "@alchemy/aa-core"
import { extractChain, PrivateKeyAccount, type Chain } from "viem"
import { EcoError } from "../common/errors/eco-error"
import { Logger } from "@nestjs/common"
import * as chains from 'viem/chains'
// export const chain: Chain = sepolia

// export const smartAccountClient = await createModularAccountAlchemyClient({
//   apiKey: "YOUR_API_KEY",
//   chain,
//   signer: LocalAccountSigner.privateKeyToAccountSigner("OWNER_MNEMONIC"),
// })
export class AAModularMultichainClient {
  private logger = new Logger(AAModularMultichainClient.name)
  readonly settings: Record<number, AlchemyModularAccountClientConfig<LocalAccountSigner<any>>>
  readonly instances: Map<number, AlchemySmartAccountClient> = new Map()

  constructor(settings: Record<string, AlchemyModularAccountClientConfig<LocalAccountSigner<any>>>) {
    this.settings = settings
  }

  async clientForChain(chainID: number): Promise<AlchemySmartAccountClient> {
    return await this.loadInstance(chainID)
  }

  async loadInstance(chainID: number): Promise<AlchemySmartAccountClient> {
    if (!this.instances.has(chainID)) {
      const client = await createModularAccountAlchemyClient({
        ...this.getSettings(chainID)
      })
      this.instances.set(chainID, client)
    }
    return this.instances.get(chainID)
  }

  /**
 * Use overrides if they exist -- otherwise use the default settings.
 * @param chain
 * @returns
 */
  private getSettings(chainID: number): AlchemyModularAccountClientConfig {
    const chain = extractChain({
      chains: Object.values(chains),
      id: chainID as any,
    })
    if (this.settings && this.settings[chainID] && chain) {
      // const chain1: Chain = sepolia
      return { ...this.settings[chainID], chain: chain[0]}
    } else {
      throw EcoError.AlchemyUnsupportedChainError(chain[0])
    }
  }


}