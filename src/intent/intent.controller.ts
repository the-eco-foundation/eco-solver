import { Controller, Get } from '@nestjs/common'
import { WebsocketIntentService } from './websocket-intent.service'
import { Network } from 'alchemy-sdk'
import { ValidateIntentService } from './validate-intent.service'
import { SourceIntent } from '../eco-configs/eco-config.types'
import { Logger } from '@nestjs/common'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { ViemEventLog } from '../common/events/websocket'

@Controller('intent')
export class SourceIntentController {
  private logger = new Logger(SourceIntentController.name)
  constructor(
    private readonly wsService: WebsocketIntentService,
    private readonly validateService: ValidateIntentService,
  ) {}

  @Get()
  async fakeIntent() {
    const si: SourceIntent = {
      network: (intent[0] as ViemEventLog).sourceNetwork as Network,
      chainID: (intent[0] as ViemEventLog).sourceChainID,
      sourceAddress: '0x',
      tokens: [],
      provers: [],
    }
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `fakeIntent intent`,
        properties: {
          si: si,
        },
      }),
    )

    return await this.wsService.addJob(si)(intent)
    // return this.wsService.addJob(Network.OPT_SEPOLIA)(intent)
  }

  @Get('process')
  async fakeProcess() {
    const hash = '0xe42305a292d4df6805f686b2d575b01bfcef35f22675a82aacffacb2122b890f'
    return await this.validateService.validateIntent(hash)
    //  await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.process_intent, hash, {
    //   jobId: hash,
    // })
  }
}
const intent = [
  {
    blockNumber: 20204829,
    blockHash: '0xee82ccc53dd2c197aa9d500ece9eced7629ab371d7959800b71d4cf3db259272',
    transactionIndex: 24,
    removed: false,
    address: '0x13727384eb72ee4de1332634957f5473e5f1d52a',
    data: '0x00000000000000000000000035395d96fcb26d416fd5593cadec099cf6b2900700000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000220a3108e1981cb8c8f4d43b08a6f4890ef13945ca9ecb47ef904702d8c97da427f00000000000000000000000099b07ff401e2c73826f3043adab2ef37e53d4f23000000000000000000000000000000000000000000000000000000000000000100000000000000000000000094b008aa00579c1307b0ef2c499ad98a8ce58e58000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000035395d96fcb26d416fd5593cadec099cf6b2900700000000000000000000000000000000000000000000000000000000000c7ebe000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000c7ebe',
    topics: [
      '0x653c41cbe9402a28b206076ac6e316307a1ef8f76f247c1da9fdc2f50a405819',
      '0xfcc7ac8eb8990e8bed1905d5c7ea3f479a64c7cd387e4cf716295ab0a2a03038',
      '0x000000000000000000000000000000000000000000000000000000000000000a',
      '0x0000000000000000000000000000000000000000000000000000000067056c13',
    ],
    transactionHash: '0x2318be80f282ea8cd72ad39987a702e336a9993679bdeb6dcfad80ffd95f5815',
    logIndex: 179,
    sourceNetwork: 'base-mainnet' as Network,
    sourceChainID: 8453,
  } as unknown as ViemEventLog,
]
