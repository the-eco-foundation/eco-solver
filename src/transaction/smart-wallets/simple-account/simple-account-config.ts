import type { Account, Hex, Transport, WalletClient } from 'viem'
import { base, baseSepolia, optimism, optimismSepolia } from 'viem/chains'

type SupportedChain = typeof base | typeof optimism | typeof baseSepolia | typeof optimismSepolia

export interface SimpleAccountConfig {
  signerPk: Hex
  smartWalletAddr: Hex
  walletClient: WalletClient<Transport, SupportedChain, Account>
}
