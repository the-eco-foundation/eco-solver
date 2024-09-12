import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Nonce } from './schemas/nonce.schema'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { entries } from 'lodash'
import { AtomicKeyClientParams, AtomicNonceService } from './atomic.nonce.service'
import { Hex, sha256 } from 'viem'
import { MultichainSmartAccountService } from '../alchemy/multichain_smart_account.service'

/**
 * TODO this class needs to be assigned to an EAO, a userOp gets its nonce throught the alchemy sdk
 * which pulls its fromt the rpc bundler
 */
@Injectable()
export class NonceService extends AtomicNonceService<Nonce> implements OnApplicationBootstrap {
  private intentJobConfig: JobsOptions

  constructor(
    @InjectModel(Nonce.name) private nonceModel: Model<Nonce>,
    @InjectQueue(QUEUES.SIGNER.queue) private readonly signerQueue: Queue,
    private readonly smartAccountService: MultichainSmartAccountService,
    private readonly ecoConfigService: EcoConfigService,
  ) {
    super(nonceModel)
  }
  async onApplicationBootstrap() {
    // console.log('accountService', (await this.smartAccountService.getClient(84532)).account.address) //// <<<-------
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
    this.syncQueue()
  }

  async syncQueue() {
    const { should, hash } = await this.shouldSync()
    if (should) {
      await this.signerQueue.add(
        QUEUES.SIGNER.jobs.nonce_sync,
        {},
        {
          jobId: hash,
          ...this.intentJobConfig,
        },
      )
    }
  }

  protected override async getSyncParams(): Promise<AtomicKeyClientParams[]> {
    const paramsAsync = entries(this.ecoConfigService.getSolvers()).map(async ([chainId]) => {
      const client = await this.smartAccountService.getClient(parseInt(chainId))

      const address = client.account.address
      return { address, client } as AtomicKeyClientParams
    })

    return await Promise.all(paramsAsync)
  }

  async getLastSynceAt(): Promise<Date> {
    const meta = await this.nonceModel
      .findOne({ updatedAt: { $exists: true } })
      .sort({ updatedAt: -1 })
      .exec()
    if (!meta) {
      return new Date(0)
    }
    return meta.updatedAt
  }

  async shouldSync(): Promise<{ should: boolean; hash: string }> {
    const lastSyncAt = await this.getLastSynceAt()
    const should =
      Date.now() - lastSyncAt.getTime() > this.ecoConfigService.getEth().nonce.update_interval_ms
    const input = `0x${lastSyncAt.toISOString()}` as Hex
    return { should, hash: sha256(input) }
  }
}
