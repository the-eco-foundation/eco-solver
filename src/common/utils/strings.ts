export function getRandomString() {
  return Math.random().toString(36).slice(2)
}

export function getDestinationNetworkAddressKey(network: string, tokenAddress: string): string {
  return `${network}-${tokenAddress}`
}
