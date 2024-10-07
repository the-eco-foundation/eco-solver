import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../../intent/schemas/source-intent.schema'
import { Model } from 'mongoose'
import { UtilsIntentService } from '../utils-intent.service'
import { FulfillIntentService } from '../fulfill-intent.service'
import { SimpleAccountClientService } from '../../transaction/simple-account-client.service'

describe('FulfillIntentService', () => {
  let fulfillIntentService: FulfillIntentService
  let simpleAccountClientService: DeepMocked<SimpleAccountClientService>
  let utilsIntentService: DeepMocked<UtilsIntentService>
  let ecoConfigService: DeepMocked<EcoConfigService>

  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillIntentService,
        { provide: SimpleAccountClientService, useValue: createMock<SimpleAccountClientService>() },
        { provide: UtilsIntentService, useValue: createMock<UtilsIntentService>() },
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
        {
          provide: getModelToken(SourceIntentModel.name),
          useValue: createMock<Model<SourceIntentModel>>(),
        },
      ],
    }).compile()

    fulfillIntentService = chainMod.get(FulfillIntentService)
    simpleAccountClientService = chainMod.get(SimpleAccountClientService)
    utilsIntentService = chainMod.get(UtilsIntentService)
    ecoConfigService = chainMod.get(EcoConfigService)

    fulfillIntentService['logger'].debug = mockLogDebug
    fulfillIntentService['logger'].log = mockLogLog
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
