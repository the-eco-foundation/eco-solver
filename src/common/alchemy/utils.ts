import { http, HttpTransport, webSocket, WebSocketTransport } from 'viem'
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

/**
 * Returns a transport for the chain with the given api key
 *
 * @param chain the chain to get the transport for
 * @param apiKey the alchemy api key
 * @param websocketEnabled whether to use websocket or not, defaults to true
 * @returns the websocket or http transport
 */
export function getTransport(
  chain: chains.Chain,
  apiKey: string,
  websocketEnabled: boolean = false,
): WebSocketTransport | HttpTransport {
  const url = getAchemyRPCUrl(chain, apiKey, websocketEnabled)
  return websocketEnabled ? webSocket(url, { keepAlive: true, reconnect: true }) : http(url)
}
