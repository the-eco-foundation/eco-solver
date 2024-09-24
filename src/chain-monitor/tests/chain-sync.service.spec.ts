import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { ChainSyncService } from '../chain-sync.service'
import { WebsocketIntentService } from '../../intent/websocket-intent.service'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../../intent/schemas/source-intent.schema'
import { Model } from 'mongoose'
import { Solver, SourceIntent } from '../../eco-configs/eco-config.types'
import { IntentSourceAbi } from '../../contracts'
import { entries } from 'lodash'
import { SimpleAccountClientService } from '../../transaction/simple-account-client.service'

describe('ChainSyncService', () => {
  let chainSyncService: ChainSyncService
  let accountService: DeepMocked<SimpleAccountClientService>
  let websocketIntentService: DeepMocked<WebsocketIntentService>
  let ecoConfigService: DeepMocked<EcoConfigService>

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        ChainSyncService,
        {
          provide: SimpleAccountClientService,
          useValue: createMock<SimpleAccountClientService>(),
        },
        { provide: WebsocketIntentService, useValue: createMock<WebsocketIntentService>() },
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
        {
          provide: getModelToken(SourceIntentModel.name),
          useValue: createMock<Model<SourceIntentModel>>(),
        },
      ],
    }).compile()

    chainSyncService = chainMod.get(ChainSyncService)
    accountService = chainMod.get(SimpleAccountClientService)
    websocketIntentService = chainMod.get(WebsocketIntentService)
    ecoConfigService = chainMod.get(EcoConfigService) as DeepMocked<EcoConfigService>
  })

  afterEach(async () => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
  })

  describe('on chain sync startup', () => {
    it('should start a sync', async () => {
      const mockSyncTxs = jest.fn()
      chainSyncService.syncTxs = mockSyncTxs
      await chainSyncService.onApplicationBootstrap()
      expect(mockSyncTxs).toHaveBeenCalledTimes(1)
    })
  })

  describe('on syncTxs', () => {
    it('should start a sync for all source intent contracts', async () => {
      const intentSources = [
        { network: 'network1' },
        { network: 'network2' },
        { network: 'network3' },
      ] as any
      const mockSyncTxsPerSource = jest.fn()
      chainSyncService.syncTxsPerSource = mockSyncTxsPerSource
      ecoConfigService.getSourceIntents.mockReturnValue(intentSources)

      chainSyncService.syncTxs()
      expect(mockSyncTxsPerSource).toHaveBeenCalledTimes(3)
      expect(mockSyncTxsPerSource).toHaveBeenNthCalledWith(1, intentSources[0])
      expect(mockSyncTxsPerSource).toHaveBeenNthCalledWith(2, intentSources[1])
      expect(mockSyncTxsPerSource).toHaveBeenNthCalledWith(3, intentSources[2])
    })
  })

  describe('on syncTxsPerSource', () => {
    let mockGetContractEvents: jest.Mock

    const sourceIntent = {
      chainID: 123,
      sourceAddress: '0x123',
      network: 'network1',
    } as unknown as SourceIntent

    const solvers = {
      123: {
        solverAddress: '0x456',
      },
      456: {
        solverAddress: '0x789',
      },
      789: {
        solverAddress: '0xabc',
      },
    } as any as Solver[]

    const solverSupportedChains = entries(solvers).map(([chainID]) => Number.parseInt(chainID))

    const model = { event: { blockNumber: 50n, sourceChainID: sourceIntent.chainID } }

    beforeEach(() => {
      mockGetContractEvents = jest.fn().mockResolvedValue([])

      accountService.getClient = jest.fn().mockReturnValue({
        getContractEvents: mockGetContractEvents,
      })

      ecoConfigService.getSolvers.mockReturnValue(solvers)
    })

    it('should set fromBlock to 0x0 when no transactions in db', async () => {
      await chainSyncService.syncTxsPerSource(sourceIntent)
      expect(mockGetContractEvents).toHaveBeenCalledTimes(1)
      expect(mockGetContractEvents).toHaveBeenCalledWith({
        address: sourceIntent.sourceAddress,
        abi: IntentSourceAbi,
        eventName: 'IntentCreated',
        args: {
          _destinationChain: solverSupportedChains,
        },
        fromBlock: 0n,
        toBlock: 'latest',
      })
    })

    it('should set fromBlock to the block of the db transaction', async () => {
      chainSyncService['getLastRecordedTx'] = jest.fn().mockResolvedValueOnce([model])

      await chainSyncService.syncTxsPerSource(sourceIntent)
      expect(mockGetContractEvents).toHaveBeenCalledTimes(1)
      expect(mockGetContractEvents).toHaveBeenCalledWith({
        address: sourceIntent.sourceAddress,
        abi: IntentSourceAbi,
        eventName: 'IntentCreated',
        args: {
          _destinationChain: solverSupportedChains,
        },
        fromBlock: model.event.blockNumber,
        toBlock: 'latest',
      })
    })

    it('should log when no transfers exist since last db record', async () => {
      chainSyncService['getLastRecordedTx'] = jest.fn().mockResolvedValueOnce([model])
      const mockLog = jest.fn()
      chainSyncService['logger'].log = mockLog
      await chainSyncService.syncTxsPerSource(sourceIntent)
      expect(mockGetContractEvents).toHaveBeenCalledTimes(1)
      expect(mockLog).toHaveBeenCalledTimes(1)
      expect(mockLog).toHaveBeenCalledWith({
        msg: `No transactions found for source ${sourceIntent.network} to sync from block ${model.event.blockNumber}`,
        chainID: model.event.sourceChainID,
        fromBlock: model.event.blockNumber,
      })
    })

    it('should process all the txs since the last saved blockNumber', async () => {
      chainSyncService['getLastRecordedTx'] = jest.fn().mockResolvedValueOnce([model])
      const logs = [{ msg: 'firstlog' }, { msg: 'secondlog' }, { msg: 'thirdlog' }]
      const returnLogs = logs.map((log) => {
        return {
          ...log,
          sourceNetwork: sourceIntent.network,
          sourceChainID: sourceIntent.chainID,
        }
      })
      const mockProcessJob = jest.fn()
      const mockAddJob = jest.fn(() => mockProcessJob)
      websocketIntentService.addJob = mockAddJob as any
      mockGetContractEvents.mockResolvedValueOnce(logs)
      ecoConfigService.getSourceIntents.mockReturnValue([sourceIntent])

      await chainSyncService.syncTxs()
      expect(mockAddJob).toHaveBeenCalledTimes(1)
      expect(mockProcessJob).toHaveBeenCalledTimes(1)
      expect(mockAddJob).toHaveBeenCalledWith(sourceIntent)
      expect(mockProcessJob).toHaveBeenCalledWith(returnLogs)
    })
  })
})
