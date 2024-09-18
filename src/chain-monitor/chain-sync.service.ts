import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { SourceIntentModel } from '../intent/schemas/source-intent.schema'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { SourceIntent } from '../eco-configs/eco-config.types'
import { MultichainSmartAccountService } from '../alchemy/multichain_smart_account.service'
import { IntentSourceAbi } from '../contracts'
import { entries } from 'lodash'
import { BlockTag } from 'viem'

@Injectable()
export class ChainSyncService implements OnModuleInit {
  private logger = new Logger(ChainSyncService.name)

  constructor(
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly accountService: MultichainSmartAccountService,
    private ecoConfigService: EcoConfigService,
  ) {}

  async onModuleInit() {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `ChainSyncService:onModuleInit`,
      }),
    )
    await this.syncTxs()
  }

  async syncTxs() {
    const syncMissingTxsPromisses = this.ecoConfigService.getSourceIntents().map((source) => {
      return this.syncMissingIntentTxs(source)
    })

    await Promise.all(syncMissingTxsPromisses)
  }

  async syncMissingIntentTxs(source: SourceIntent) {
    const solverSupportedChains = entries(this.ecoConfigService.getSolvers()).map(
      ([chainID]) => chainID,
    )
    const lastRecordedTx = await this.getLastRecordedTx(source)

    const fromBlock: bigint =
      lastRecordedTx.length > 0 ? BigInt(lastRecordedTx[0].event.blockNumber) : 0n
    const toBlock: BlockTag = 'latest'
    const client = await this.accountService.getClient(source.chainID)
    const logs = await client.getContractEvents({
      address: source.sourceAddress,
      abi: IntentSourceAbi,
      eventName: 'IntentCreated',
      args: {
        _destinationChain: solverSupportedChains,
      },
      fromBlock,
      toBlock,
    })

    if (logs.length === 0) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `No transactions found for source ${source.network} to sync from block ${fromBlock}`,
          properties: {
            chainID: source.chainID,
            fromBlock,
          },
        }),
      )
      return
    }
  }

  async getLastRecordedTx(source: SourceIntent): Promise<SourceIntentModel[]> {
    return await this.intentModel
      .find({ 'event.sourceChainID': source.chainID })
      .sort({ 'event.blockNumber': -1 })
      .limit(1)
      .exec()
  }
}
