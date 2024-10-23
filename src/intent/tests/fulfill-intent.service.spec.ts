const mockEncodeFunctionData = jest.fn()
import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SourceIntentModel } from '../../intent/schemas/source-intent.schema'
import { Model } from 'mongoose'
import { UtilsIntentService } from '../utils-intent.service'
import { FulfillIntentService } from '../fulfill-intent.service'
import { SimpleAccountClientService } from '../../transaction/smart-wallets/simple-account/simple-account-client.service'
import { EcoError } from '../../common/errors/eco-error'
import { ProofService } from '../../prover/proof.service'
import { InboxAbi, PROOF_HYPERLANE, PROOF_STORAGE } from '../../contracts'
import { Hex } from 'viem'

jest.mock('viem', () => {
  return {
    ...jest.requireActual('viem'),
    encodeFunctionData: mockEncodeFunctionData,
  }
})

describe('FulfillIntentService', () => {
  let fulfillIntentService: FulfillIntentService
  let simpleAccountClientService: DeepMocked<SimpleAccountClientService>
  let proofService: DeepMocked<ProofService>
  let utilsIntentService: DeepMocked<UtilsIntentService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let intentModel: DeepMocked<Model<SourceIntentModel>>

  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()
  const mockLogError = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillIntentService,
        { provide: SimpleAccountClientService, useValue: createMock<SimpleAccountClientService>() },
        { provide: ProofService, useValue: createMock<ProofService>() },
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
    proofService = chainMod.get(ProofService)
    utilsIntentService = chainMod.get(UtilsIntentService)
    ecoConfigService = chainMod.get(EcoConfigService)
    intentModel = chainMod.get(getModelToken(SourceIntentModel.name))

    fulfillIntentService['logger'].debug = mockLogDebug
    fulfillIntentService['logger'].log = mockLogLog
    fulfillIntentService['logger'].error = mockLogError
  })
  const hash = '0x1'
  const claimant = '0x2'
  const solver = { solverAddress: '0x1', chainID: 1 }
  const model = { intent: { hash, destinationChainID: 85432 }, event: { sourceChainID: 11111 } }
  const emptyTxs = [{ data: undefined, to: hash }]
  afterEach(async () => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
    mockLogDebug.mockClear()
    mockLogLog.mockClear()
    mockLogError.mockClear()
  })

  describe('on executeFulfillIntent', () => {
    describe('on setup', () => {
      it('should throw if data can`t be destructured', async () => {
        //when error
        const error = new Error('stuff went bad')
        utilsIntentService.getIntentProcessData = jest.fn().mockResolvedValue({ err: error })
        await expect(() => fulfillIntentService.executeFulfillIntent(hash)).rejects.toThrow(error)
      })

      it('should set the claimant for the fulfill', async () => {
        utilsIntentService.getIntentProcessData = jest.fn().mockResolvedValue({ model, solver })
        const mockGetFulfillIntentTx = jest.fn()
        fulfillIntentService['getFulfillIntentTx'] = mockGetFulfillIntentTx
        fulfillIntentService['getTransactionsForTargets'] = jest.fn().mockReturnValue([])
        jest.spyOn(ecoConfigService, 'getEth').mockReturnValue({ claimant } as any)
        expect(await fulfillIntentService.executeFulfillIntent(hash)).toBeUndefined()
        expect(mockGetFulfillIntentTx).toHaveBeenCalledWith(solver.solverAddress, model)
      })
    })

    describe('on failed execution', () => {
      it('should bubble up the thrown error', async () => {
        const error = new Error('stuff went bad')
        utilsIntentService.getIntentProcessData = jest.fn().mockResolvedValue({ model, solver })
        const mockGetFulfillIntentData = jest.fn()
        fulfillIntentService['getFulfillIntentData'] = mockGetFulfillIntentData
        fulfillIntentService['getTransactionsForTargets'] = jest.fn().mockReturnValue([])
        jest.spyOn(ecoConfigService, 'getEth').mockReturnValue({ claimant } as any)
        jest.spyOn(simpleAccountClientService, 'getClient').mockImplementation(async (id) => {
          return {
            execute: () => {
              throw error
            },
          } as any
        })
        await expect(() => fulfillIntentService.executeFulfillIntent(hash)).rejects.toThrow(error)
      })

      it('should log error', async () => {
        const error = new Error('stuff went bad')
        utilsIntentService.getIntentProcessData = jest.fn().mockResolvedValue({ model, solver })
        const mockGetFulfillIntentData = jest.fn()
        fulfillIntentService['getFulfillIntentData'] = mockGetFulfillIntentData
        fulfillIntentService['getTransactionsForTargets'] = jest.fn().mockReturnValue([])
        jest.spyOn(ecoConfigService, 'getEth').mockReturnValue({ claimant } as any)
        jest.spyOn(simpleAccountClientService, 'getClient').mockImplementation(async (id) => {
          return {
            execute: () => {
              throw error
            },
          } as any
        })
        await expect(() => fulfillIntentService.executeFulfillIntent(hash)).rejects.toThrow(error)
        expect(mockLogError).toHaveBeenCalledTimes(1)
        expect(mockLogError).toHaveBeenCalledWith({
          msg: `fulfillIntent: Invalid transaction`,
          error: EcoError.FulfillIntentBatchError.toString(),
          model,
          errorPassed: error,
          flatExecuteData: emptyTxs,
        })
      })

      it('should update the db model with status and error receipt', async () => {
        const error = new Error('stuff went bad')
        utilsIntentService.getIntentProcessData = jest.fn().mockResolvedValue({ model, solver })
        const mockGetFulfillIntentData = jest.fn()
        fulfillIntentService['getFulfillIntentData'] = mockGetFulfillIntentData
        fulfillIntentService['getTransactionsForTargets'] = jest.fn().mockReturnValue([])
        jest.spyOn(ecoConfigService, 'getEth').mockReturnValue({ claimant } as any)
        jest.spyOn(simpleAccountClientService, 'getClient').mockImplementation(async (id) => {
          return {
            execute: () => {
              throw error
            },
          } as any
        })
        await expect(() => fulfillIntentService.executeFulfillIntent(hash)).rejects.toThrow(error)
        expect(utilsIntentService.updateIntentModel).toHaveBeenCalledTimes(1)
        expect(utilsIntentService.updateIntentModel).toHaveBeenCalledWith(intentModel, {
          ...model,
          status: 'FAILED',
          receipt: error,
        })
      })
    })

    describe('on successful execution', () => {
      const transactionHash = '0x33'
      const mockExecute = jest.fn()
      const mockWaitForTransactionReceipt = jest.fn()
      beforeEach(async () => {
        fulfillIntentService['getFulfillIntentTx'] = jest.fn().mockReturnValue(emptyTxs)
        utilsIntentService.getIntentProcessData = jest.fn().mockResolvedValue({ model, solver })
        fulfillIntentService['getTransactionsForTargets'] = jest.fn().mockReturnValue([])

        jest.spyOn(simpleAccountClientService, 'getClient').mockImplementation(async (id) => {
          return {
            execute: mockExecute.mockResolvedValue(transactionHash),
            waitForTransactionReceipt: mockWaitForTransactionReceipt.mockResolvedValue({
              transactionHash,
            }),
          } as any
        })

        expect(await fulfillIntentService.executeFulfillIntent(hash)).resolves
        expect(fulfillIntentService['getTransactionsForTargets']).toHaveBeenCalledTimes(1)
        expect(fulfillIntentService['getFulfillIntentTx']).toHaveBeenCalledTimes(1)
      })

      afterEach(() => {
        mockExecute.mockClear()
        mockWaitForTransactionReceipt.mockClear()
      })

      it('should execute the transactions', async () => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
        expect(mockExecute).toHaveBeenCalledWith([emptyTxs])
      })

      it('should get a receipt', async () => {
        expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1)
        expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: transactionHash })
      })

      it('should log', async () => {
        expect(mockLogDebug).toHaveBeenCalledTimes(2)
        expect(mockLogDebug).toHaveBeenNthCalledWith(2, {
          msg: `Fulfilled transactionHash ${transactionHash}`,
          userOPHash: { transactionHash },
          destinationChainID: model.intent.destinationChainID,
          sourceChainID: model.event.sourceChainID,
        })
      })

      it('should update the db model with status and receipt', async () => {
        expect(utilsIntentService.updateIntentModel).toHaveBeenCalledTimes(1)
        expect(utilsIntentService.updateIntentModel).toHaveBeenCalledWith(intentModel, {
          ...model,
          status: 'SOLVED',
          receipt: { transactionHash },
        })
      })
    })
  })

  describe('on handleErc20', () => {
    const selector = '0xa9059cbb'
    const solverAddress = '0x131'
    const target = '0x9'
    const amount = 100n
    it('should return empty on unsupported selector', async () => {
      expect(
        fulfillIntentService.handleErc20(
          { selector: '0x1', targetConfig: {} } as any,
          {} as any,
          '0x0',
        ),
      ).toEqual([])
    })
    it('should return the transfer selector with data correctly encoded', async () => {
      const transferFunctionData = '0x9911'
      mockEncodeFunctionData.mockReturnValue(transferFunctionData)
      expect(
        fulfillIntentService.handleErc20(
          { selector, decodedFunctionData: { args: [, amount] } } as any,
          { solverAddress } as any,
          target,
        ),
      ).toEqual([{ to: target, data: transferFunctionData }])
      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: expect.anything(),
        functionName: 'transfer',
        args: [solverAddress, amount],
      })
    })
  })

  describe('on getTransactionsForTargets', () => {
    const model = { intent: { targets: ['0x1'], data: ['0x2'] } }
    const tt = { targetConfig: { contractType: 'erc20' } }
    it('should return empty if input is invalid', async () => {
      expect(fulfillIntentService['getTransactionsForTargets']({} as any)).toEqual([])
      expect(fulfillIntentService['getTransactionsForTargets']({ model: { a: 1 } } as any)).toEqual(
        [],
      )
      expect(
        fulfillIntentService['getTransactionsForTargets']({ solver: { b: 2 } } as any),
      ).toEqual([])
    })

    it('should return empty if no targets', async () => {
      expect(
        fulfillIntentService['getTransactionsForTargets']({
          model: { intent: { targets: [] } },
        } as any),
      ).toEqual([])
    })

    it('should return empty item for invalid trnasaction target data', async () => {
      utilsIntentService.getTransactionTargetData = jest.fn().mockReturnValue(null)
      expect(fulfillIntentService['getTransactionsForTargets']({ model, solver } as any)).toEqual(
        [],
      )
      expect(utilsIntentService.getTransactionTargetData).toHaveBeenCalledWith(
        model,
        solver,
        model.intent.targets[0],
        model.intent.data[0],
      )
      expect(mockLogError).toHaveBeenCalledTimes(1)
      expect(mockLogError).toHaveBeenCalledWith({
        msg: `fulfillIntent: Invalid transaction data`,
        error: EcoError.FulfillIntentNoTransactionError.toString(),
        model,
      })
    })

    it('should return empty for erc721, erc1155, or anything other than erc20', async () => {
      //erc721
      utilsIntentService.getTransactionTargetData = jest
        .fn()
        .mockReturnValue({ targetConfig: { contractType: 'erc721' } })
      expect(fulfillIntentService['getTransactionsForTargets']({ model, solver } as any)).toEqual(
        [],
      )

      //erc1155
      utilsIntentService.getTransactionTargetData = jest
        .fn()
        .mockReturnValue({ targetConfig: { contractType: 'erc1155' } })
      expect(fulfillIntentService['getTransactionsForTargets']({ model, solver } as any)).toEqual(
        [],
      )

      //default/catch-all
      utilsIntentService.getTransactionTargetData = jest
        .fn()
        .mockReturnValue({ targetConfig: { contractType: 'face' } })
      expect(fulfillIntentService['getTransactionsForTargets']({ model, solver } as any)).toEqual(
        [],
      )
    })

    it('should return correct data for erc20', async () => {
      const mockHandleErc20Data = [{ to: '0x1', data: '0x2' }]
      utilsIntentService.getTransactionTargetData = jest.fn().mockReturnValue(tt)
      fulfillIntentService.handleErc20 = jest.fn().mockReturnValue(mockHandleErc20Data)
      expect(fulfillIntentService['getTransactionsForTargets']({ model, solver } as any)).toEqual(
        mockHandleErc20Data,
      )
    })

    it('should process multiple targets', async () => {
      const model = { intent: { targets: ['0x1', '0x2'], data: ['0x3', '0x4'] } }
      const mockHandleErc20Data = [
        { to: '0x11', data: '0x22' },
        { to: '0x33', data: '0x44' },
      ]
      utilsIntentService.getTransactionTargetData = jest.fn().mockReturnValue(tt)
      fulfillIntentService.handleErc20 = jest.fn().mockImplementation((tt, solver, target) => {
        if (target === model.intent.targets[0]) return mockHandleErc20Data[0]
        if (target === model.intent.targets[1]) return mockHandleErc20Data[1]
      })
      expect(fulfillIntentService['getTransactionsForTargets']({ model, solver } as any)).toEqual(
        mockHandleErc20Data,
      )
    })
  })

  describe('on getFulfillIntentTx', () => {
    const model = {
      intent: {
        hash: '0x1234',
        targets: ['0x1'],
        data: ['0x2'],
        prover: ['0x1122'],
        expiryTime: '0x2233',
        nonce: '0x3344',
      },
      event: { sourceChainID: 10 },
    }
    const solver = { solverAddress: '0x9' as Hex }
    let defaultArgs = [] as any

    beforeEach(() => {
      jest.spyOn(ecoConfigService, 'getEth').mockReturnValue({ claimant } as any)
      defaultArgs = [
        model.event.sourceChainID,
        model.intent.targets,
        model.intent.data,
        model.intent.expiryTime,
        model.intent.nonce,
        claimant,
        model.intent.hash,
      ]
    })
    it('should use the correct function name and args for PROOF_STORAGE', async () => {
      const mockGetProofType = jest.fn().mockReturnValue(PROOF_STORAGE)
      proofService.getProofType = mockGetProofType
      fulfillIntentService['getFulfillIntentTx'](solver.solverAddress, model as any)
      expect(proofService.getProofType).toHaveBeenCalledTimes(1)
      expect(proofService.getProofType).toHaveBeenCalledWith(model.intent.prover)
      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: InboxAbi,
        functionName: 'fulfillStorage',
        args: defaultArgs,
      })
    })
    it('should use the correct function name and args for PROOF_HYPERLANE', async () => {
      const mockGetProofType = jest.fn().mockReturnValue(PROOF_HYPERLANE)
      proofService.getProofType = mockGetProofType
      defaultArgs.push(model.intent.prover)
      fulfillIntentService['getFulfillIntentTx'](solver.solverAddress, model as any)
      expect(proofService.getProofType).toHaveBeenCalledTimes(1)
      expect(proofService.getProofType).toHaveBeenCalledWith(model.intent.prover)
      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: InboxAbi,
        functionName: 'fulfillHyperInstant',
        args: defaultArgs,
      })
    })
  })
})
