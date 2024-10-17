import { defineChain } from 'viem'
import { chainConfig } from 'viem/op-stack'

// settlement chain
const sourceId = 8453 //base mainnet

export const helix = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 8921733,
  name: 'Helix Test',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://helix-test.calderachain.xyz/http'],
      webSocket: ['wss://helix-test.calderachain.xyz/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'helix-test explorer',
      url: 'https://helix-test.calderaexplorer.xyz',
      apiUrl: 'https://helix-test.calderaexplorer.xyz/api/v2',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    disputeGameFactory: {
      [sourceId]: {
        address: '0x685eeDFd7280cbdC1B49E766a06b31D00dAEab2b',
      },
    },
    l2OutputOracle: {
      [sourceId]: {
        address: '0xf3B21c72BFd684eC459697c48f995CDeb5E5DB9d',
      },
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 4286263,
    },
    portal: {
      [sourceId]: {
        address: '0x8C3df798e9CA0826Cb9DB3530635aa719EB1E562',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0xe746B6ac4c5Fca4770e0468D9aA62CbE6c55803A',
      },
    },
  },
  sourceId,
})
