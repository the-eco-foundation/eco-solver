import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { ProofService } from '../../prover/proof.service'
import { PROOF_HYPERLANE, PROOF_STORAGE, ProofType } from '../../contracts'
import { Hex } from 'viem'
import { MultichainPublicClientService } from '../../transaction/multichain-public-client.service'

describe('ProofService', () => {
  let proofService: ProofService
  let multichainPublicClientService: DeepMocked<MultichainPublicClientService>
  let ecoConfigService: DeepMocked<EcoConfigService>

  const mockLogDebug = jest.fn()
  const mockLogLog = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        ProofService,
        {
          provide: MultichainPublicClientService,
          useValue: createMock<MultichainPublicClientService>(),
        },
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
      ],
    }).compile()

    proofService = chainMod.get(ProofService)
    multichainPublicClientService = chainMod.get(MultichainPublicClientService)
    ecoConfigService = chainMod.get(EcoConfigService)

    proofService['logger'].debug = mockLogDebug
    proofService['logger'].log = mockLogLog
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    mockLogDebug.mockClear()
    mockLogLog.mockClear()
  })

  describe('on startup', () => {
    it('should call loadProofTypes', async () => {
      const mockLoad = jest.fn()
      proofService['loadProofTypes'] = mockLoad
      await proofService.onModuleInit()
      expect(mockLoad).toHaveBeenCalledTimes(1)
    })
  })

  describe('on loadProofTypes', () => {
    const mockGetProofTypes = jest.fn()
    const sourceIntents = [
      { chainID: 1, provers: ['0x123', '0x456'] },
      { chainID: 2, provers: ['0x123', '0x777'] },
    ]
    const proofContracts = {
      [sourceIntents[0].provers[0]]: PROOF_HYPERLANE,
      [sourceIntents[0].provers[1]]: PROOF_HYPERLANE,
      [sourceIntents[1].provers[1]]: PROOF_STORAGE,
    }
    const proof1: Record<Hex, ProofType> = {}
    const proof2: Record<Hex, ProofType> = {}
    beforeEach(async () => {
      sourceIntents[0].provers.forEach((s) => {
        proof1[s] = PROOF_HYPERLANE
      })
      sourceIntents[1].provers.forEach((s) => {
        if (s === sourceIntents[0].provers[0]) {
          proof2[s] = PROOF_HYPERLANE
          return
        }
        proof2[s] = PROOF_STORAGE
      })
      proofService['getProofTypes'] = mockGetProofTypes.mockImplementation(
        async (chainID: number) => {
          switch (chainID) {
            case 1:
              return proof1
            case 2:
              return proof2
          }
        },
      )
      ecoConfigService.getSourceIntents = jest.fn().mockReturnValue(sourceIntents)
      await proofService.onModuleInit()
    })

    afterEach(() => {
      mockGetProofTypes.mockClear()
    })

    it('should call getProofTypes for all source intents', async () => {
      expect(mockGetProofTypes).toHaveBeenCalledTimes(sourceIntents.length)
    })

    it('should set the proofContracts', async () => {
      expect(proofService['proofContracts']).toEqual(proofContracts)
    })

    it('should should log', async () => {
      expect(mockLogDebug).toHaveBeenCalledTimes(1)
      expect(mockLogDebug).toHaveBeenCalledWith({
        msg: 'loadProofTypes loaded all the proof types',
        proofs: proofContracts,
      })
    })
  })
})
