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
import { Network } from 'alchemy-sdk'
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

/**
 * Returns the Alchemy network for the given chain ID.
 * @param chainId The chain ID.
 * @returns The Alchemy network.
 */
export function getAlchemyNetwork(chainId: number): Network {
  switch (chainId) {
    case 1:
      return Network.ETH_MAINNET
    case 10:
      return Network.OPT_MAINNET
    case 8453:
      return Network.BASE_MAINNET
    case 11155111:
      return Network.ETH_SEPOLIA
    case 11155420:
      return Network.OPT_SEPOLIA
    case 84532:
      return Network.BASE_SEPOLIA
    default:
      return '' as Network
  }
}
