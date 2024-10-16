import { chains } from '@alchemy/aa-core'

/**
 * Merges the two strings into a valid api url
 * @param rpc the rpc endpoint
 * @param apiKey the alchemy api key
 * @returns
 */
export function getAchemyRPCUrl(
  chain: chains.Chain,
  apiKey: string,
  websocketEnabled: boolean = true,
): string {
  const url = websocketEnabled
    ? chain.rpcUrls.alchemy.http[0].replace('https', 'wss')
    : chain.rpcUrls.alchemy.http[0]
  return url + '/' + apiKey
}
