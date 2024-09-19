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
    blockNumber: 19562099,
    blockHash: '0xebb3dcfd3695b4a5891a78b38de32bac2c29d9fb6af4da9c23215eb9929f3b6f',
    transactionIndex: 39,
    removed: false,
    address: '0x26D2C47c5659aC8a1c4A29A052Fa7B2ccD45Ca43',
    data: '0x000000000000000000000000c9ef11eef77b7972ad0014a25b9381dad449959400000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000020002d4731f12590bc3cee7e45917db909f0db339f2790a0149b82893c95caa89cb000000000000000000000000000000000000000000000000000000000000000100000000000000000000000094b008aa00579c1307b0ef2c499ad98a8ce58e58000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000c9ef11eef77b7972ad0014a25b9381dad449959400000000000000000000000000000000000000000000000000000000000fb384000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000fb384',
    topics: [
      '0x4d57d71884135619aa0097f5e665cc0257fcf37b35433f4b554f57a182e77416',
      '0x0d52f783d79a0cb7087a368760f13b038920ebccfcb8f776d9d37a8471f6f18b',
      '0x000000000000000000000000000000000000000000000000000000000000000a',
      '0x0000000000000000000000000000000000000000000000000000000066f1cec1',
    ],
    transactionHash: '0xf4c341ef2a2dc5ea8681ed588aee03d9da877a377409fee09b17b92035fa814e',
    logIndex: 92,
    sourceNetwork: 'base-mainnet' as Network,
    sourceChainID: 8453,
  } as unknown as ViemEventLog,
]
