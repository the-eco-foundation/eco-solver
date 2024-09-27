import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { zeroHash } from 'viem'
import * as _ from 'lodash'
import {
  Alchemy,
  CustomGraphqlWebhookParams,
  Webhook as AlchemyWebhook,
  WebhookType,
} from 'alchemy-sdk'
import { QUEUES } from '../../common/redis/constants'
import { getIntentJobId } from '../../common/utils/strings'
import { EcoLogMessage } from '../../common/logging/eco-log-message'
import { AlchemyWebhookQueryGenerator } from '../helpers/alchemy-webhook-query-generator'
import { SourceIntent } from '../../eco-configs/eco-config.types'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { IntentSource__factory } from '../../typing/contracts'
import { EcoProtocolWebhookRequestInterface } from '../interfaces/eco-protocol-webhook-request.interface'
import { ViemEventLog } from '../../common/events/websocket'

const intentSourceInterface = IntentSource__factory.createInterface()
const intentCreatedEventTopic0 = intentSourceInterface.getEvent('IntentCreated').topicHash

@Injectable()
export class MonitorService implements OnApplicationBootstrap {
  private logger = new Logger(MonitorService.name)

  // Map webhook id to its data
  private ecoProtocolWebhooks: Record<
    string,
    { webhook: AlchemyWebhook; sourceIntent: SourceIntent }
  >

  constructor(
    private readonly ecoConfigService: EcoConfigService,
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
  ) {}

  static getWebhookPath() {
    return '/monitor/webhook'
  }

  async onApplicationBootstrap() {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `${MonitorService.name}.onApplicationBootstrap()`,
      }),
    )

    const ecoProtocolWebhooks = await this.initializeWebhooks()
    this.ecoProtocolWebhooks = _.keyBy(ecoProtocolWebhooks, 'webhook.id')
  }

  async processWebhook(webhook: EcoProtocolWebhookRequestInterface) {
    const { sourceIntent } = this.getWebhookByID(webhook.webhookId)
    const { logs, number: blockNumber, hash: blockHash } = webhook.event.data.block

    for (const log of logs) {
      if (log.topics[0] !== intentCreatedEventTopic0) {
        this.logger.warn(
          EcoLogMessage.fromDefault({
            message: 'Unexpected event found in webhook',
            properties: {
              log,
            },
          }),
        )
        continue
      }

      const intentCreatedEvent: ViemEventLog = {
        logIndex: log.index,
        data: log.data,
        topics: log.topics,
        transactionHash: log.transaction.hash,
        sourceNetwork: sourceIntent.network,
        sourceChainID: sourceIntent.chainID,
        address: sourceIntent.sourceAddress,
        blockHash,
        blockNumber,
        removed: false,
        transactionIndex: log.transaction.index,
      }

      const jobId = getIntentJobId(
        'websocket',
        intentCreatedEvent.transactionHash ?? zeroHash,
        intentCreatedEvent.logIndex ?? 0,
      )

      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Webhook intent logged`,
          properties: {
            jobId,
            intentCreatedEvent,
          },
        }),
      )

      // add to processing queue
      await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.create_intent, intentCreatedEvent, {
        jobId,
        ...this.ecoConfigService.getRedis().jobs.intentJobConfig,
      })
    }
  }

  getWebhookByID(webhookID: string) {
    return this.ecoProtocolWebhooks[webhookID]
  }

  private getWebhookUrl() {
    const { baseUrl } = this.ecoConfigService.getMonitorConfig()
    return baseUrl + MonitorService.getWebhookPath()
  }

  /**
   * Initialize Alchemy webhooks by checking which are already initialized to prevent reinitialization
   * @private
   */
  private async initializeWebhooks() {
    // Get the webhooks from Alchemy
    const { webhooks } = await this.getAlchemyClient().notify.getAllWebhooks()

    // Filter out the webhooks that are related to the solver
    const solverWebhooks = webhooks.filter(this.isEcoProtocolWebhook.bind(this))
    const availableNetworks = solverWebhooks.map((webhook) => webhook.network)

    const sourceIntents = this.ecoConfigService.getSourceIntents()

    // Get the networks that are supported but don't have a webhook initialized
    const unavailableSourceIntents = sourceIntents.filter(
      (sourceIntent) => !availableNetworks.includes(sourceIntent.network),
    )

    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `${MonitorService.name}.initializeWebhooks()`,
        properties: {
          sourceIntents,
          unavailableNetworks: unavailableSourceIntents,
        },
      }),
    )

    // Initialize the webhooks for the networks that don't have one
    const initializedWebhooks = await Promise.all(
      unavailableSourceIntents.map((sourceIntent) => this.initializeWebhook(sourceIntent)),
    )

    return [...solverWebhooks, ...initializedWebhooks].map((webhook) => {
      const sourceIntent = sourceIntents.find(
        (sourceIntent) => sourceIntent.network === webhook.network,
      )
      return { webhook, sourceIntent: sourceIntent! }
    })
  }

  /**
   * Validate if an Alchemy webhook is an Eco protocol webhook
   * @param webhook
   * @private
   */
  private isEcoProtocolWebhook(webhook: AlchemyWebhook): boolean {
    return (
      webhook.isActive &&
      webhook.type === WebhookType.GRAPHQL &&
      webhook.url === this.getWebhookUrl()
    )
  }

  /**
   * Initialize the webhook for the specified network
   * @param sourceIntent
   * @private
   */
  private async initializeWebhook(sourceIntent: SourceIntent) {
    const alchemy = this.getAlchemyClient()
    const intentSourceAddr = sourceIntent.sourceAddress

    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `${MonitorService.name}.initializeWebhook()`,
        properties: {
          alchemyNetwork: sourceIntent.network,
          intentSourceAddr,
        },
      }),
    )

    return alchemy.notify.createWebhook(this.getWebhookUrl(), WebhookType.GRAPHQL, {
      network: sourceIntent.network,
      graphqlQuery: {
        skip_empty_messages: true,
        query: AlchemyWebhookQueryGenerator.generateIntentSourceQuery(intentSourceAddr),
      },
    } as unknown as CustomGraphqlWebhookParams)
  }

  /**
   * Get the Alchemy client for the specified network. These clients are not network specific,
   * So we'll use Optimism's client as the primary one.
   * @private
   */
  private getAlchemyClient() {
    const apiConfig = this.ecoConfigService.getAlchemy()
    return new Alchemy({
      apiKey: apiConfig.apiKey,
      authToken: apiConfig.authToken,
    })
  }
}
