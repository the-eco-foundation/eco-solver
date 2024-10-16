import { entries, keys } from 'lodash'
import { Chain, getAddress, Hex } from 'viem'

/**
 * Gets the url for a chain with the given api key, either websocket or http
 *
 * @param chain the chain to get the url for
 * @param apiKey the api key if it is required
 * @param websocketEnabled whether to try the websocket url if there is one
 * @returns
 */
export function getRpcUrl(
  chain: Chain,
  apiKey?: string,
  websocketEnabled: boolean = false,
): { url: string; isWebsocket: boolean } {
  let rpcUrl = chain.rpcUrls.default
  for (const key in chain.rpcUrls) {
    if (key === 'default') {
      continue
    }
    rpcUrl = chain.rpcUrls[key]
    break
  }
  const isWebsocket =
    websocketEnabled && rpcUrl.webSocket != undefined && rpcUrl.webSocket.length > 0
  const url = isWebsocket ? rpcUrl.webSocket![0] : rpcUrl.http[0]

  return {
    url: apiKey ? url + '/' + apiKey : url,
    isWebsocket,
  }
}

/**
 * Lowercase all top-level keys of the given `object` to lowercase.
 *
 * @returns {Object}
 */
export function addressKeys(obj: Record<Hex, any>): Record<Hex, any> | undefined {
  if (!obj) {
    return undefined
  }

  return Object.entries(obj).reduce((carry, [key, value]) => {
    carry[getAddress(key)] = value

    return carry
  }, {})
}

/**
 * Recursively converts all BigInt values in an object to strings.
 *
 * @param {Object} obj - The object to process.
 * @returns {Object} - The new object with BigInt values as strings.
 */
export function convertBigIntsToStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return obj.toString()
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings)
  }

  if (typeof obj === 'object') {
    return Object.entries(obj).reduce(
      (carry, [key, value]) => {
        carry[key] = convertBigIntsToStrings(value)
        return carry
      },
      {} as Record<string, any>,
    )
  }

  return obj
}
