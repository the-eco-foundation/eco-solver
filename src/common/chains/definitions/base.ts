import { Chain } from 'viem'
import { base as vbase, baseSepolia as vbases } from 'viem/chains'

export const base: Chain = {
  ...vbase,
  rpcUrls: {
    ...vbase.rpcUrls,
    alchemy: {
      http: ['https://base-mainnet.g.alchemy.com/v2'],
    },
  },
}
export const baseSepolia: Chain = {
  ...vbases,
  rpcUrls: {
    ...vbases.rpcUrls,
    alchemy: {
      http: ['https://base-sepolia.g.alchemy.com/v2'],
    },
  },
}
