import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../../intent/schemas/source-intent.schema'
import { Model } from 'mongoose'
import { UtilsIntentService } from '../utils-intent.service'
import { getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Queue } from 'bullmq'

describe('UtilsIntentService', () => {
  let utilsIntentService: UtilsIntentService
  let ecoConfigService: DeepMocked<EcoConfigService>
  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        UtilsIntentService,
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
        {
          provide: getModelToken(SourceIntentModel.name),
          useValue: createMock<Model<SourceIntentModel>>(),
        },
      ],
    })
      .overrideProvider(getQueueToken(QUEUES.SOURCE_INTENT.queue))
      .useValue(createMock<Queue>())
      .compile()

    utilsIntentService = chainMod.get(UtilsIntentService)
    ecoConfigService = chainMod.get(EcoConfigService)

    utilsIntentService['logger'].debug = mockLogDebug
    utilsIntentService['logger'].log = mockLogLog
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
