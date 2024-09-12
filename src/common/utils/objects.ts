/**
 * Lowercase all top-level keys of the given `object` to lowercase.
 *
 * @returns {Object}
 */
export function lowercaseKeys(obj: Record<string, any>): Record<string, any> | undefined {
  if (!obj) {
    return undefined
  }

  return Object.entries(obj).reduce((carry, [key, value]) => {
    carry[key.toLowerCase()] = value

    return carry
  }, {})
}
