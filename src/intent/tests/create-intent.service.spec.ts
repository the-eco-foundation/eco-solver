const mockDecodeCreateIntentLog = jest.fn()
import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../schemas/source-intent.schema'
import { Model } from 'mongoose'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Queue } from 'bullmq'
import { CreateIntentService } from '../create-intent.service'
import { ValidSmartWalletService } from '../../solver/filters/valid-smart-wallet.service'
import { SourceIntentDataModel } from '../schemas/source-intent-data.schema'
import { FlagService } from '../../flags/flags.service'

jest.mock('../../contracts', () => {
  return {
    ...jest.requireActual('../../contracts'),
    decodeCreateIntentLog: mockDecodeCreateIntentLog,
  }
})

describe('CreateIntentService', () => {
  let createIntentService: CreateIntentService
  let validSmartWalletService: DeepMocked<ValidSmartWalletService>
  let flagService: DeepMocked<FlagService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let sourceIntentModel: DeepMocked<Model<SourceIntentModel>>
  let queue: DeepMocked<Queue>
  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        CreateIntentService,
        { provide: ValidSmartWalletService, useValue: createMock<ValidSmartWalletService>() },
        { provide: FlagService, useValue: createMock<FlagService>() },
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
    //turn off the services from logging durring testing
    chainMod.useLogger(false)

    createIntentService = chainMod.get(CreateIntentService)
    validSmartWalletService = chainMod.get(ValidSmartWalletService)
    flagService = chainMod.get(FlagService)
    ecoConfigService = chainMod.get(EcoConfigService)
    sourceIntentModel = chainMod.get(getModelToken(SourceIntentModel.name))
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

  describe.only('on createIntent', () => {
    const mockEvent = {
      data: '0xda',
      transactionHash: '0x123',
      topics: ['0x456'],
      sourceChainID: 85432,
    }
    const mockIntent = { creator: '0xaaa', hash: mockEvent.transactionHash, logIndex: 1 }
    beforeEach(() => {
      mockDecodeCreateIntentLog.mockReturnValue({ hash: mockEvent.transactionHash })
      const mockSourceIntentEvent = jest.fn()
      SourceIntentDataModel.fromEvent = mockSourceIntentEvent
      mockSourceIntentEvent.mockReturnValue(mockIntent)
    })

    it('should decode the event', async () => {
      createIntentService.createIntent(mockEvent as any)
      expect(mockLogDebug).toHaveBeenCalledWith({
        msg: `createIntent ${mockEvent.transactionHash}`,
        intentHash: mockEvent.transactionHash,
      })
      expect(mockDecodeCreateIntentLog).toHaveBeenCalledWith(mockEvent.data, mockEvent.topics)
    })

    it('should return if model has already been created in db', async () => {
      const mockFindOne = jest.fn().mockReturnValue({ hash: mockEvent.transactionHash })
      sourceIntentModel.findOne = mockFindOne
      await createIntentService.createIntent(mockEvent as any)
      expect(mockFindOne).toHaveBeenCalledWith({ 'intent.hash': mockEvent.transactionHash })
      expect(mockLogDebug).toHaveBeenNthCalledWith(2, {
        msg: `Record for intent already exists ${mockEvent.transactionHash}`,
        intentHash: mockIntent.hash,
        intent: mockIntent,
      })
      expect(validSmartWalletService.validateSmartWallet).not.toHaveBeenCalled()
    })

    it('should check if the bendWalletOnly flag is up', async () => {
      const mockFindOne = jest.fn().mockReturnValue(undefined)
      sourceIntentModel.findOne = mockFindOne
      const mockFlag = jest.spyOn(flagService, 'getFlagValue').mockReturnValue(false)
      const mockValidateSmartWallet = jest.fn().mockReturnValue(true)
      validSmartWalletService.validateSmartWallet = mockValidateSmartWallet
      await createIntentService.createIntent(mockEvent as any)
      expect(mockFlag).toHaveBeenCalledTimes(1)
      expect(mockValidateSmartWallet).toHaveBeenCalledTimes(0)
    })

    it('should validate the intent is from a bend wallet', async () => {
      const mockFindOne = jest.fn().mockReturnValue(undefined)
      sourceIntentModel.findOne = mockFindOne
      const mockValidateSmartWallet = jest.fn().mockReturnValue(true)
      jest.spyOn(flagService, 'getFlagValue').mockReturnValue(true)
      validSmartWalletService.validateSmartWallet = mockValidateSmartWallet
      await createIntentService.createIntent(mockEvent as any)
      expect(mockValidateSmartWallet).toHaveBeenCalledTimes(1)
      expect(mockValidateSmartWallet).toHaveBeenCalledWith(
        mockIntent.creator,
        mockEvent.sourceChainID,
      )
    })

    it('should create an intent model in the database', async () => {
      const mockFindOne = jest.fn().mockReturnValue(undefined)
      sourceIntentModel.findOne = mockFindOne
      const mockValidateSmartWallet = jest.fn().mockReturnValue(true)
      validSmartWalletService.validateSmartWallet = mockValidateSmartWallet
      const mockCreate = jest.fn()
      sourceIntentModel.create = mockCreate
      await createIntentService.createIntent(mockEvent as any)
      expect(mockCreate).toHaveBeenCalledWith({
        event: mockEvent,
        intent: mockIntent,
        receipt: null,
        status: 'PENDING',
      })

      mockCreate.mockClear()
      mockValidateSmartWallet.mockResolvedValueOnce(false)
      await createIntentService.createIntent(mockEvent as any)
      expect(mockCreate).toHaveBeenCalledWith({
        event: mockEvent,
        intent: mockIntent,
        receipt: null,
        status: 'NON-BEND-WALLET',
      })
    })

    it('should not enqueue a job if the intent is not from a bend wallet', async () => {
      const mockFindOne = jest.fn().mockReturnValue(undefined)
      const mockQueueAdd = jest.fn()
      sourceIntentModel.findOne = mockFindOne
      sourceIntentModel.create = jest.fn().mockReturnValue({ intent: mockIntent })
      queue.add = mockQueueAdd
      validSmartWalletService.validateSmartWallet = jest.fn().mockReturnValue(false)

      await createIntentService.createIntent(mockEvent as any)
      expect(mockQueueAdd).not.toHaveBeenCalled()
      expect(mockLogDebug).toHaveBeenNthCalledWith(2, {
        msg: `Recorded intent ${mockEvent.transactionHash}`,
        intentHash: mockIntent.hash,
        intent: mockIntent,
        isBendWallet: false,
      })
    })

    it('should enqueue a job if the intent is from a bend wallet', async () => {
      const mockFindOne = jest.fn().mockReturnValue(undefined)
      const mockQueueAdd = jest.fn()
      sourceIntentModel.findOne = mockFindOne
      sourceIntentModel.create = jest.fn().mockReturnValue({ intent: mockIntent })
      queue.add = mockQueueAdd
      validSmartWalletService.validateSmartWallet = jest.fn().mockReturnValue(true)

      const jobId = `create-${mockIntent.hash}-${mockIntent.logIndex}`
      await createIntentService.createIntent(mockEvent as any)
      expect(mockQueueAdd).toHaveBeenCalledTimes(1)
      expect(mockQueueAdd).toHaveBeenCalledWith(
        QUEUES.SOURCE_INTENT.jobs.validate_intent,
        mockIntent.hash,
        { jobId },
      )

      expect(mockLogDebug).toHaveBeenNthCalledWith(2, {
        msg: `Recorded intent ${mockEvent.transactionHash}`,
        intentHash: mockIntent.hash,
        intent: mockIntent,
        isBendWallet: true,
        jobId,
      })
    })
  })
})
