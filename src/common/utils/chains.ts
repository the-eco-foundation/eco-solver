import {
  // arbitrum,
  // arbitrumGoerli,
  // arbitrumSepolia,
  // goerli,
  // mainnet,
  // optimism,
  // optimismGoerli,
  // optimismSepolia,
  // sepolia,
  base,
  // baseGoerli,
  // baseSepolia,
  // polygonMumbai,
  // polygonAmoy,
  // polygon,
  // fraxtal,
  // zora,
  // zoraSepolia,
} from '@alchemy/aa-core'
// Chain type is imported from viem package, which is a dependency of the aa-core package
// will complain if importing from viem directly...
// import { Chain } from '@alchemy/aa-core/node_modules/viem/_types/types/chain'
import { Network } from 'alchemy-sdk'
import { Chain as ViemChain } from 'viem'
import { zora } from 'viem/chains'
/**
 * Chains supported by the Alchemy API, with custom RPC URLs.
 */
const ChainsSupportedAA: ViemChain[] = [
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

const ChainsSupportedEco: ViemChain[] = [
  // ecoSepolia,
  // eco
]

/**
 * Chains supported by the Alchemy API, with custom RPC URLs.
 */
export const ChainsSupported: ViemChain[] = ChainsSupportedAA as ViemChain[]


// export const ecoSepolia: ViemChain = {
//   ...vab,
//   rpcUrls: {
//     ...vab.rpcUrls,
//     alchemy: {
//       http: ["https://arb-mainnet.g.alchemy.com/v2"],
//     },
//   },
// };

// helix: {
//   chainId: 8921733,
//   url: `https://helix-test.calderachain.xyz/http`,
//   accounts: [DEPLOYER_PRIVATE_KEY],
// },