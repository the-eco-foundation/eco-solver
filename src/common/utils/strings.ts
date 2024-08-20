export function getRandomString() {
  return Math.random().toString(36).slice(2)
}

export function getDestinationNetworkAddressKey(network: string, tokenAddress: string): string {
  return `${network}-${tokenAddress}`
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
