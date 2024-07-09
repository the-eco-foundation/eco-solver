import { Network } from 'alchemy-sdk'
import * as _ from 'lodash'

export class EcoError extends Error {
  // Alchemy Service
  static AlchemyUnsupportedNetworkError(network: Network) {
    return new EcoError(`App does not support network ${network}, check your config file`)
  }
  static AlchemyServiceProviderError(network: string) {
    return new EcoError(`Could not create alchemy provider ${network}`)
  }

  // EcoConfig Service

  static isEcoError(error: any): boolean {
    return error instanceof EcoError
  }

  static getErrorMessage(error: any): string {
    if (_.isString(error)) {
      return error
    }

    if (EcoError.isEcoError(error)) {
      return error.toString()
    }

    return (
      error.body ||
      error.error?.reason ||
      error.reason ||
      error.message ||
      error.enumKey ||
      'Unexpected error occurred'
    )
  }
}
