import { Log } from 'viem'
import { AlchemyWebhookRequest } from './alchemy-webhook-request.interface'

export interface WebhookEcoProtocolLog {
  data: Log['data']
  index: number
  topics: Log['topics']
  transaction: {
    hash: Log['transactionHash']
    index: Log['transactionIndex']
  }
}

export type EcoProtocolWebhookRequestInterface = AlchemyWebhookRequest<{
  block: {
    hash: Log['blockHash']
    number: Log['blockNumber']
    logs: WebhookEcoProtocolLog[]
  }
}>
