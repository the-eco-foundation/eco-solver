import { Network } from 'alchemy-sdk'
import { ethers } from 'ethers'
import { Params as PinoParams } from 'nestjs-pino'

// The config type that we store in json
export type EcoConfigType = {
  server: {
    url: string
  }
  externalAPIs: {
    sentryDNS: string
  }
  redis: {
    host: string
    port: number
    password: string
  }
  eth: {
    privateKey: string
    alchemy: AlchemyConfigType
  }
  aws: AwsCredentials
  database: {
    auth: MongoAuthType
    uriPrefix: string
    uri: string
    dbName: string
    enableJournaling: boolean
  }
  logger: {
    usePino: boolean
    pinoConfig: PinoParams
  }
}

export type EcoConfigKeys = keyof EcoConfigType

/**
 * The config type for the aws credentials
 */
export type AwsCredentials = {
  region: string
  secretID: string
}

/**
 * The config type for the auth section of the database.
 */
export type MongoAuthType = {
  enabled: boolean
  username: string
  password: string
  type: string
}

/**
 * The whole config type for alchemy.
 */
export type AlchemyConfigType = {
  authToken: string
  default: {
    network: Network
    apiKey: string
  }
  secondary: [AlchemyNetworkConfigType]
}

/**
 * The config type for a single alchemy network.
 */
export type AlchemyNetworkConfigType = {
  network: Network
  apiKey: string
}

/**
 * The config type for a single bridge chain.
 */
export class BridgeChain {
  network: Network
  disbursementContractAddress: string
  tokenAddresses: string[]
  minBalance: bigint

  constructor(bridgeChain: BridgeChain) {
    this.network = bridgeChain.network
    this.disbursementContractAddress = bridgeChain.disbursementContractAddress
    this.tokenAddresses = bridgeChain.tokenAddresses.map((address) => ethers.getAddress(address))
    this.minBalance = bridgeChain.minBalance
  }

  supportsToken(address: string): boolean {
    return this.tokenAddresses.includes(ethers.getAddress(address))
  }
}

/**
 * The class that represents the whole bridge network that the service supports.
 * The funds are deposited on any chain's disbursement contract can be disbursed on any other chain in the network
 */
export class BridgeNetwork {
  private bridgeMap: Map<string, BridgeChain>

  bridgeSources: BridgeChain[]

  constructor(sources: BridgeChain[]) {
    const chains = new Set<BridgeChain>()
    for (const bridge of sources) {
      chains.add(new BridgeChain(bridge))
    }
    this.bridgeSources = Array.from(chains)
  }

  getBridgeMap(): Map<string, BridgeChain> {
    if (!this.bridgeMap) {
      this.bridgeMap = new Map<Network, BridgeChain>()
      this.bridgeSources.forEach((bridge) => {
        this.bridgeMap.set(bridge.network, bridge)
      })
    }
    return this.bridgeMap
  }

  getBridge(network: Network): BridgeChain {
    return this.getBridgeMap().get(network)
  }

  getBridgeForAlchemy(network: Network): BridgeChain {
    return this.getBridgeMap().get(this.getNetworkFromAlchemy(network))
  }

  getNetworkFromAlchemy(network: Network): Network {
    return network
  }
}
