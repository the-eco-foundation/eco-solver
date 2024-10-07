import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../../intent/schemas/source-intent.schema'
import { Model } from 'mongoose'
import { UtilsIntentService } from '../utils-intent.service'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Queue } from 'bullmq'
import { BalanceService } from '../../balance/balance.service'
import { FeasableIntentService } from '../feasable-intent.service'

describe('FeasableIntentService', () => {
  let feasableIntentService: FeasableIntentService
  let balanceService: DeepMocked<BalanceService>
  let utilsIntentService: DeepMocked<UtilsIntentService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let queue: DeepMocked<Queue>
  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        FeasableIntentService,
        { provide: BalanceService, useValue: createMock<BalanceService>() },
        { provide: UtilsIntentService, useValue: createMock<UtilsIntentService>() },
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
        {
          provide: getModelToken(SourceIntentModel.name),
          useValue: createMock<Model<SourceIntentModel>>(),
        },
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

    feasableIntentService = chainMod.get(FeasableIntentService)
    balanceService = chainMod.get(BalanceService)
    utilsIntentService = chainMod.get(UtilsIntentService)
    ecoConfigService = chainMod.get(EcoConfigService)
    queue = chainMod.get(getQueueToken(QUEUES.SOURCE_INTENT.queue))

    feasableIntentService['logger'].debug = mockLogDebug
    feasableIntentService['logger'].log = mockLogLog
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
