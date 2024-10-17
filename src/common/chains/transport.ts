import { Chain, http, HttpTransport, webSocket, WebSocketTransport } from 'viem'
import { getRpcUrl } from '../viem/utils'

/**
 * Returns a transport for the chain with the given api key
 *
 * @param chain the chain to get the transport for
 * @param apiKey the alchemy api key
 * @param websocketEnabled whether to use websocket or not, defaults to true
 * @returns the websocket or http transport
 */
export function getTransport(
  chain: Chain,
  apiKey: string,
  websocketEnabled: boolean = false,
): WebSocketTransport | HttpTransport {
  const { url, isWebsocket } = getRpcUrl(chain, apiKey, websocketEnabled)
  return isWebsocket ? webSocket(url, { keepAlive: true, reconnect: true }) : http(url)
}
