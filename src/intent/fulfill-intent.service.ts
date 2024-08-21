import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SourceIntentTxHash } from '../common/events/websocket'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { UtilsIntentService } from './utils-intent.service'
import { BalanceService } from '../balance/balance.service'
import { AASmartAccountService } from '../alchemy/aa-smart-multichain.service'

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
    private readonly aaService: AASmartAccountService,
    private readonly ecoConfigService: EcoConfigService,
  ) { }

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
    
  }

  async onApplicationBootstrap() {
    const a = await this.aaService.getClient(11155420)
    console.log(a)
  }

  async executeFullfillIntent(intentHash: SourceIntentTxHash) { }
}
