import { Chain } from 'viem'
import { optimism as vop, optimismSepolia as vops } from 'viem/chains'

export const optimism: Chain = {
  ...vop,
  rpcUrls: {
    ...vop.rpcUrls,
    alchemy: {
      http: ['https://opt-mainnet.g.alchemy.com/v2'],
    },
  },
}

export const optimismSepolia: Chain = {
  ...vops,
  rpcUrls: {
    ...vops.rpcUrls,
    alchemy: {
      http: ['https://opt-sepolia.g.alchemy.com/v2'],
    },
  },
}
