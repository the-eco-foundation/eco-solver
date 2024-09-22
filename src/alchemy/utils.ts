import { chains } from '@alchemy/aa-core'
import { Chain, http, HttpTransport, webSocket, WebSocketTransport } from 'viem'

/**
 * Merges the two strings into a valid api url
 * @param rpc the rpc endpoint
 * @param apiKey the alchemy api key
 * @returns
 */
export function getAchemyRPCUrl(
  chain: Chain | chains.Chain,
  apiKey: string,
  websocketEnabled: boolean = true,
): string {
  const url =
    websocketEnabled && chain.rpcUrls.alchemy.webSocket
      ? chain.rpcUrls.alchemy.webSocket[0]
      : chain.rpcUrls.alchemy.http[0]
  return url + '/' + apiKey
}

/**
 * Returns a transport for the chain with the given api key
 *
 * @param chain the chain to get the transport for
 * @param apiKey the alchemy api key
 * @param websocketEnabled whether to use websocket or not, defaults to true
 * @returns the websocket or http transport
 */
export function getTransport(
  chain: Chain | chains.Chain,
  apiKey: string,
  websocketEnabled: boolean = true,
): WebSocketTransport | HttpTransport {
  const url = getAchemyRPCUrl(chain, apiKey, websocketEnabled)
  return websocketEnabled ? webSocket(url) : http(url)
}
