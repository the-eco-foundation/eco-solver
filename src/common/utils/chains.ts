import {
  arbitrum,
  arbitrumGoerli,
  arbitrumSepolia,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  optimismSepolia,
  sepolia,
  base,
  baseGoerli,
  baseSepolia,
  polygonMumbai,
  polygonAmoy,
  polygon,
  fraxtal,
  zora,
  zoraSepolia,
} from '@alchemy/aa-core'
// Chain type is imported from viem package, which is a dependency of the aa-core package
// will complain if importing from viem directly...
import { Chain } from '@alchemy/aa-core/node_modules/viem/_types/types/chain'
import { Chain as ViemChain } from 'viem'

/**
 * Chains supported by the Alchemy API, with custom RPC URLs. 
 */
const ChainsSupportedAA: Chain[] = [
  arbitrum,
  arbitrumGoerli,
  arbitrumSepolia,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  optimismSepolia,
  sepolia,
  base,
  baseGoerli,
  baseSepolia,
  polygonMumbai,
  polygonAmoy,
  polygon,
  fraxtal,
  zora,
  zoraSepolia,
]

/**
 * Chains supported by the Alchemy API, with custom RPC URLs.
 */
export const ChainsSupported: ViemChain[] = ChainsSupportedAA as ViemChain[]