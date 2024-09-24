import type { Account, Hex, Transport, WalletClientConfig } from 'viem'
import { base, baseSepolia, optimism, optimismSepolia } from 'viem/chains'

type SupportedChain = typeof base | typeof optimism | typeof baseSepolia | typeof optimismSepolia

export interface SimpleAccountClientConfig
  extends WalletClientConfig<Transport, SupportedChain, Account> {
  simpleAccountAddress: Hex
}
