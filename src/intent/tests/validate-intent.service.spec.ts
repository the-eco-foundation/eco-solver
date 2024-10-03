import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../../intent/schemas/source-intent.schema'
import { Model } from 'mongoose'
import { ValidateIntentService } from '../validate-intent.service'
import { ProofService } from '../../prover/proof.service'
import { UtilsIntentService } from '../utils-intent.service'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Queue } from 'bullmq'

describe('ValidateIntentService', () => {
  let validateIntentService: ValidateIntentService
  let utilsIntentService: DeepMocked<UtilsIntentService>
  let proofService: DeepMocked<ProofService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  const mockLogDebug = jest.fn()
  const mockLogError = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateIntentService,
        {
          provide: UtilsIntentService,
          useValue: createMock<UtilsIntentService>(),
        },
        { provide: ProofService, useValue: createMock<ProofService>() },
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

    validateIntentService = chainMod.get(ValidateIntentService)
    utilsIntentService = chainMod.get(UtilsIntentService)
    proofService = chainMod.get(ProofService)
    ecoConfigService = chainMod.get(EcoConfigService)

    validateIntentService['logger'].debug = mockLogDebug
    validateIntentService['logger'].error = mockLogError
  })

  afterEach(async () => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
  })

  describe('on ', () => {
    it('should', async () => {})
  })
})
