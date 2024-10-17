import { defineChain } from 'viem'
import { chainConfig } from 'viem/op-stack'

// settlement chain
const sourceId = 84532 //base sepolia

export const ecoSepolia = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 471923,
  name: 'Eco Test',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://eco-testnet.rpc.caldera.xyz/http'],
      webSocket: ['wss://eco-testnet.rpc.caldera.xyz/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'eco-testnet explorer',
      url: 'https://eco-testnet.explorer.caldera.xyz/',
      apiUrl: 'https://eco-testnet.explorer.caldera.xyz/api/v2',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    disputeGameFactory: {
      [sourceId]: {
        address: '0x01C6834a6EA1bd8CD69F38D5E657B53BdA53d684',
      },
    },
    l2OutputOracle: {
      [sourceId]: {
        address: '0xb3EDAE5AB86f16242018c7cED4fBCabb3c784951',
      },
    },
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 4286263,
    },
    portal: {
      [sourceId]: {
        address: '0xb94EFa2bba9d52A67944c4bE1014D1A09F5d8939',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0x635f8f0Ae3fEE30C408C5c4E0C44115a2d636e29',
      },
    },
  },
  sourceId,
  testnet: true,
})
