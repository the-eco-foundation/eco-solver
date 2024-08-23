import { chains } from '@alchemy/aa-core'
export function getRandomString() {
  return Math.random().toString(36).slice(2)
}

export function getDestinationNetworkAddressKey(chainID: number, tokenAddress: string): string {
  return `${chainID}-${tokenAddress}`
}

/**
 * Appends the service name to the intent hash for the job id, else it will be the same for all intents
 * as they progress down the processing pipe and interfere in the queue
 *
 * @param intentHash the hash of the intent to fulfill
 * @returns
 */
export function getIntentJobId(serviceName: string, intentHash: string): string {
  return `${serviceName}-${intentHash}`
}

/**
 * Merges the two strings into a valid api url
 * @param rpc the rpc endpoint
 * @param apiKey the alchemy api key
 * @returns
 */
export function getAchemyRPCUrl(chain: chains.Chain, apiKey: string): string {
  return chain.rpcUrls.alchemy.http[0] + '/' + apiKey
}
