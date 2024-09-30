import { WebhookType } from 'alchemy-sdk'

export interface AlchemyWebhookRequest<Data> {
  id: string
  webhookId: string
  createdAt: string
  type: WebhookType
  event: {
    sequenceNumber: string
    data: Data
  }
}
