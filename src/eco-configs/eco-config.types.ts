import { Network } from 'alchemy-sdk'
import { ClusterNode } from 'ioredis'
import { Params as PinoParams } from 'nestjs-pino'
import * as Redis from 'ioredis'
import { Settings } from 'redlock'
import { JobsOptions } from 'bullmq'

// The config type that we store in json
export type EcoConfigType = {
  server: {
    url: string
  }
  externalAPIs: unknown
  redis: RedisConfig
  alchemy: AlchemyConfigType
  eth: {
    privateKey: string
  }
  aws: AwsCredentials
  database: {
    auth: MongoAuthType
    uriPrefix: string
    uri: string
    dbName: string
    enableJournaling: boolean
  }
  contracts: {
    sourceIntents: SourceIntent[]
    solvers: Solver[]
  }
  logger: {
    usePino: boolean
    pinoConfig: PinoParams
  }
}

export type EcoConfigKeys = keyof EcoConfigType

/**
 * The config type for the redis section
 */
export type RedisConfig = {
  connection: ClusterNode | ClusterNode[]
  options: {
    single: Redis.RedisOptions
    cluster: Redis.ClusterOptions
  }
  redlockSettings?: Partial<Settings>
  jobs: {
    intentJobConfig: JobsOptions
  }
}

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
  apiKey: string
  networks: Network[]
}

/**
 * The config type for a single prover source configuration
 */
export class SourceIntent {
  // The network that the prover is on
  network: Network
  // The address that the prover source contract is deployed at, we read events from this contract to fulfill
  sourceAddress: string
  // // The addresses of the tokens that we support as rewards
  // tokenAddresses: string[]

  // constructor(si: SourceIntent) {
  //   this.network = si.network
  //   this.sourceAddress = si.sourceAddress
  //   this.tokenAddresses = si.tokenAddresses.map((address) => ethers.getAddress(address))
  // }

  // supportsToken(address: string): boolean {
  //   return this.tokenAddresses.includes(ethers.getAddress(address))
  // }
}

/**
 * The config type for a single solver configuration
 */
export class Solver {
  // The network that the solver is on
  network: Network
  // The address that the solver contract is deployed at
  solverAddress: string
  // The address of the token that the solver is using
  tokenAddress: string

  // constructor(solver: Solver) {
  //   this.network = solver.network
  //   this.solverAddress = solver.solverAddress
  //   this.tokenAddress = ethers.getAddress(solver.tokenAddress)
  // }
}
