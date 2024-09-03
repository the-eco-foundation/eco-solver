import { EcoError } from '../errors/eco-error'

interface BaseLoggingDataParams {
  message: string
  properties?: object
}

interface LoggingDataParamsWithUser extends BaseLoggingDataParams {
  userID: string
}

interface LoggingDataParamsWithError extends BaseLoggingDataParams {
  error: EcoError
}

interface LoggingDataParamsWithErrorAndUser extends LoggingDataParamsWithError {
  userID: string
}

export class EcoLogMessage {
  private readonly _content: object

  private constructor(params: BaseLoggingDataParams) {
    this._content = {
      msg: params.message,
      ...params.properties,
    }
  }

  get content(): object {
    return this._content
  }

  static fromDefault(params: BaseLoggingDataParams): object {
    return new EcoLogMessage(params).content
  }

  static withUser(params: LoggingDataParamsWithUser): object {
    const { message, userID, properties } = params

    return this.fromDefault({
      message,
      properties: {
        userID,
        ...properties,
      },
    })
  }

  static withError(params: LoggingDataParamsWithError): object {
    const { message, error, properties } = params

    return this.fromDefault({
      message,
      properties: {
        error: error.toString(),
        ...properties,
      },
    })
  }

  static withErrorAndUser(params: LoggingDataParamsWithErrorAndUser): object {
    const { message, userID, error, properties } = params

    return this.fromDefault({
      message,
      properties: {
        userID,
        error: error.toString(),
        ...properties,
      },
    })
  }
}