import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Job, Queue } from 'bullmq'
import { WatchIntentService } from '../watch-intent.service'
import { MultichainPublicClientService } from '../../transaction/multichain-public-client.service'

describe('WatchIntentService', () => {
  let watchIntentService: WatchIntentService
  let publicClientService: DeepMocked<MultichainPublicClientService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let queue: DeepMocked<Queue>
  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  const sources = [
    { chainID: 1, sourceAddress: '0x1234', provers: ['0x88'], network: 'testnet1' },
    { chainID: 2, sourceAddress: '0x5678', provers: ['0x88', '0x99'], network: 'testnet2' },
  ] as any
  const supportedChains = sources.map((s) => BigInt(s.chainID))

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

  describe('on lifecycle', () => {
    describe('on startup', () => {
      it('should subscribe to nothing if no source intents', async () => {
        ecoConfigService.getSolvers.mockReturnValue(sources)
        const mock = jest.spyOn(watchIntentService, 'subscribe')
        await watchIntentService.onApplicationBootstrap()
        expect(mock).toHaveBeenCalledTimes(1)
      })

      it('should subscribe to all source intents', async () => {
        const mockWatch = jest.fn()
        publicClientService.getClient.mockResolvedValue({
          watchContractEvent: mockWatch,
        } as any)
        ecoConfigService.getIntentSources.mockReturnValue(sources)
        ecoConfigService.getSolvers.mockReturnValue(sources)
        await watchIntentService.onApplicationBootstrap()
        expect(mockWatch).toHaveBeenCalledTimes(2)

        for (const [index, s] of sources.entries()) {
          const { address, eventName, args } = mockWatch.mock.calls[index][0]
          const partial = { address, eventName, args }
          expect(partial).toEqual({
            address: s.sourceAddress,
            eventName: 'IntentCreated',
            args: { _destinationChain: supportedChains, _prover: s.provers },
          })
        }
      })
    })

    describe('on destroy', () => {
      it('should unsubscribe to nothing if no source intents', async () => {
        const mock = jest.spyOn(watchIntentService, 'unsubscribe')
        await watchIntentService.onModuleDestroy()
        expect(mock).toHaveBeenCalledTimes
      })

      it('should unsubscribe to all source intents', async () => {
        const mockUnwatch = jest.fn()
        publicClientService.getClient.mockResolvedValue({
          watchContractEvent: () => mockUnwatch,
        } as any)
        ecoConfigService.getIntentSources.mockReturnValue(sources)
        ecoConfigService.getSolvers.mockReturnValue(sources)
        await watchIntentService.onApplicationBootstrap()
        await watchIntentService.onModuleDestroy()
        expect(mockUnwatch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('on intent', () => {
    const s = sources[0]
    const log = { args: { _hash: BigInt(1), logIndex: BigInt(2) } } as any
    let mockQueueAdd: jest.SpyInstance<Promise<Job<any, any, string>>>

    beforeEach(() => {
      mockQueueAdd = jest.spyOn(queue, 'add')
      watchIntentService.addJob(s)([log])
      expect(mockLogDebug).toHaveBeenCalledTimes(1)
    })
    it('should convert all bigints to strings', async () => {
      expect(mockLogDebug.mock.calls[0][0].createIntent).toEqual(
        expect.objectContaining({
          args: { _hash: '1', logIndex: '2' },
        }),
      )
    })

    it('should should attach source chainID and network', async () => {
      expect(mockLogDebug.mock.calls[0][0].createIntent).toEqual(
        expect.objectContaining({
          sourceChainID: s.chainID,
          sourceNetwork: s.network,
        }),
      )
    })

    it('should should enque a job for every intent', async () => {
      expect(mockQueueAdd).toHaveBeenCalledTimes(1)
      expect(mockQueueAdd).toHaveBeenCalledWith(
        QUEUES.SOURCE_INTENT.jobs.create_intent,
        expect.any(Object),
        { jobId: 'watch-1-0' },
      )
    })
  })
})
