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
import { CreateIntentService } from '../create-intent.service'
import { ValidSmartWalletService } from '../../solver/filters/valid-smart-wallet.service'

describe('CreateIntentService', () => {
  let createIntentService: CreateIntentService
  let validSmartWalletService: DeepMocked<ValidSmartWalletService>
  let utilsIntentService: DeepMocked<UtilsIntentService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let queue: DeepMocked<Queue>
  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        CreateIntentService,
        { provide: ValidSmartWalletService, useValue: createMock<ValidSmartWalletService>() },
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

    createIntentService = chainMod.get(CreateIntentService)
    validSmartWalletService = chainMod.get(ValidSmartWalletService)
    utilsIntentService = chainMod.get(UtilsIntentService)
    ecoConfigService = chainMod.get(EcoConfigService)
    queue = chainMod.get(getQueueToken(QUEUES.SOURCE_INTENT.queue))

    createIntentService['logger'].debug = mockLogDebug
    createIntentService['logger'].log = mockLogLog
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
