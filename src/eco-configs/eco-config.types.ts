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
  sourceIntents: SourceIntent[]
  //chainID to Solver type mapping
  solvers: Record<number, Solver>
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
  networks: AlchemyNetwork[]
}

export type AlchemyNetwork = {
  name: Network
  id: number
}

/**
 * The config type for a single solver configuration
 */
export type Solver = {
  solverAddress: string
  //target address to contract type mapping
  targets: Record<string, TargetContract>
  network: Network
  chainID: number
}

/**
 * The config type for a supported target contract
 */
export interface TargetContract {
  contractType: TargetContractType
  selectors: string[]
}

/**
 * The types of contracts that we support
 */
export type TargetContractType = 'erc20' | 'erc721' | 'erc1155'

/**
 * The config type for a single prover source configuration
 */
export class SourceIntent {
  // The network that the prover is on
  network: Network
  // The address that the prover source contract is deployed at, we read events from this contract to fulfill
  sourceAddress: string
  // The addresses of the tokens that we support as rewards
  tokens: string[]
}
