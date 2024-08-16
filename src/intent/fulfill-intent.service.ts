import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SourceIntentTxHash } from '../common/events/websocket'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { TransactionTargetData, UtilsIntentService } from './utils-intent.service'
import { BalanceService } from '../balance/balance.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EcoError } from '../common/errors/eco-error'
import { getERC20Selector } from '../common/utils/ws.helpers'
import { BigNumberish, Network } from 'alchemy-sdk'
import { AddressLike } from 'ethers'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { intersectionBy } from 'lodash'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class FulfillIntentService implements OnModuleInit {
  private logger = new Logger(FulfillIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    private readonly balanceService: BalanceService,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  async executeFullfillIntent(intentHash: SourceIntentTxHash) {
  }
}
