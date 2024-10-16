import { http, HttpTransport, webSocket, WebSocketTransport } from 'viem'

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