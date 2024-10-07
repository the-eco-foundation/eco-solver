import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Queue } from 'bullmq'
import { WatchIntentService } from '../watch-intent.service'
import { MultichainPublicClientService } from '../../transaction/multichain-public-client.service'

describe('WatchIntentService', () => {
  let watchIntentService: WatchIntentService
  let publicClientService: DeepMocked<MultichainPublicClientService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let queue: DeepMocked<Queue>
  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        WatchIntentService,
        {
          provide: MultichainPublicClientService,
          useValue: createMock<MultichainPublicClientService>(),
        },
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
      ],
      imports: [
        BullModule.registerQueue({
          name: QUEUES.SOURCE_INTENT.queue,
        }),
      ],
    })
      .overrideProvider(getQueueToken(QUEUES.SOURCE_INTENT.queue))
      .useValue(createMock<Queue>())
      .compile()

    watchIntentService = chainMod.get(WatchIntentService)
    publicClientService = chainMod.get(MultichainPublicClientService)
    ecoConfigService = chainMod.get(EcoConfigService)
    queue = chainMod.get(getQueueToken(QUEUES.SOURCE_INTENT.queue))

    watchIntentService['logger'].debug = mockLogDebug
    watchIntentService['logger'].log = mockLogLog
  })

  afterEach(async () => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
    mockLogDebug.mockClear()
    mockLogLog.mockClear()
  })

  describe('on ', () => {
    it('should ', async () => {})
  })
})
