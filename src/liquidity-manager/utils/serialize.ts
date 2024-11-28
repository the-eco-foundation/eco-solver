export type Serialize<T> = {
  [K in keyof T]: T[K] extends bigint ? string : T[K] extends object ? Serialize<T[K]> : T[K]
}

function stringify(data: object) {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  })
}

export const JSONBigInt = {
  stringify,
  serialize: <T extends object>(data: T): Serialize<T> => JSON.parse(stringify(data)),
}
