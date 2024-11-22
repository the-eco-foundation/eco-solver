import { Chain } from 'viem'
import { polygon as vpolygon } from 'viem/chains'

export const polygon: Chain = {
  ...vpolygon,
  rpcUrls: {
    ...vpolygon.rpcUrls,
    alchemy: {
      http: ['https://polygon-mainnet.g.alchemy.com/v2'],
    },
  },
}
