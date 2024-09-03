import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Nonce } from './schemas/nonce.schema'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { AASmartMultichainClient } from '../alchemy/aa-smart-multichain-client'
import { entries } from 'lodash'
import { NonceMeta } from './schemas/nonce_meta.schema'
import { AtomicKeyClientParams, AtomicNonceService } from './atomic.nonce.service'
import { AASmartAccountService } from '../alchemy/aa-smart-multichain.service'
import { Hex, sha256 } from 'viem'

@Injectable()
export class NonceService extends AtomicNonceService<Nonce> implements OnModuleInit {
  private intentJobConfig: JobsOptions
  private client: AASmartAccountService
  constructor(
    @InjectModel(Nonce.name) private nonceModel: Model<Nonce>,
    @InjectModel(NonceMeta.name) private nonceMetaModel: Model<NonceMeta>,
    @InjectQueue(QUEUES.SIGNER.queue) private readonly signerQueue: Queue,
    private readonly ecoConfigService: EcoConfigService,
  ) {
    super(nonceModel)
  }
  async onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }
  setClient(aa: AASmartAccountService) {
    this.client = aa
  }

  async initNonce(aa: AASmartAccountService) {
    this.setClient(aa)
    const { should, hash } = await this.shouldSync()
    if (should) {
      const syncParams = await this.getSyncParams(aa)
      await this.signerQueue.add(QUEUES.SIGNER.jobs.nonce_sync, syncParams, {
        jobId: hash,
        ...this.intentJobConfig,
      })
    }
  }

  async getSyncParams(aa: AASmartAccountService): Promise<AtomicKeyClientParams[]> {
    const paramsAsync = entries(this.ecoConfigService.getSolvers()).map(async ([chainId]) => {
      const client = await aa.getClient(parseInt(chainId))

      const address = client.account.address
      return { address, client } as AtomicKeyClientParams
    })

    return await Promise.all(paramsAsync)

    // let nonces = await this.getNonces()

    // const expData = new Date(Date.now() - this.ecoConfigService.getEth().nonce.update_interval_ms)
    // nonces = nonces.filter(nonce => nonce.updatedAt < expData)
    // const params: AtomicKeyClientParams[] = nonces.reduce((acc, nonce) => {
    //   const { address, chainId } = nonce.getAtomicNonceVals()
    //   acc.push({ address, client: this.client.instances.get(chainId) })
    //   return acc
    // }, [])

    // return await this.syncNonces(params)
  }

  async getLastSynceAt(): Promise<Date> {
    const meta = await this.nonceMetaModel.findOne().exec()
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
