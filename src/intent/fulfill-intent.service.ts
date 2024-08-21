import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SourceIntentTxHash } from '../common/events/websocket'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { UtilsIntentService } from './utils-intent.service'
import { BalanceService } from '../balance/balance.service'
import { AASmartAccountService } from '../alchemy/aa-smart-multichain.service'
import { ERC20Abi } from '../contracts'
import {  encodeFunctionData} from 'viem'

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

    await this.executeFullfillIntent('0xINTENT_HASH')

  }

  async executeFullfillIntent(intentHash: SourceIntentTxHash) {
    const smartAccountClient = await this.aaService.getClient(11155420)

    const uoCallData = encodeFunctionData({
      abi: [{
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }],
      functionName: "mint",
      args: [3000000000n],
    })

    // @ts-ignore
    const uo = await smartAccountClient.sendUserOperation({
      uo: {
        target: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
        data: uoCallData,
      },
    })
    // smartAccountClient.sendTransaction({
    //   to: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
    //   data: uoCallData,
    //   nonce: 1n
    // })
    // const tx = await smartAccountClient.readContract({
    //   address: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
    //   abi: ERC20Abi,
    //   functionName: "balanceOf",
    //   args: [smartAccountClient.account.address]
    // })
    // console.log(tx)
    const txHash = await smartAccountClient.waitForUserOperationTransaction(uo)
    console.log(txHash)

        const tx = await smartAccountClient.readContract({
      address: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
      abi: ERC20Abi,
      functionName: "balanceOf",
      args: [smartAccountClient.account.address]
    })
    console.log(tx)
  }
}
