import { IntentSource__factory } from '../../typing/contracts'

export class AlchemyWebhookQueryGenerator {
  static generateIntentSourceQuery(intentSourceAddr: string): string {
    const intentCreatedEventTopic0 =
      IntentSource__factory.createInterface().getEvent('IntentCreated').topicHash

    return `
      {
        block {
          hash
          number
          logs(
            filter: {
              addresses: "${intentSourceAddr}",
              topics: ["${intentCreatedEventTopic0}"]
            }
          ) {
            data
            index
            topics
            transaction {
              hash
              index
            }
          }
        }
      }
    `
  }
}
