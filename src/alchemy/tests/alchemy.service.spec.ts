import { Test, TestingModule } from '@nestjs/testing'
const mockedAbiCoder = jest.fn()
import { DeepMocked, createMock } from '@golevelup/ts-jest'
import { AlchemyService } from '../alchemy.service'
import { Alchemy, Network } from 'alchemy-sdk'
import { AlchemyProvider, Wallet } from 'ethers'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { EcoError } from '../../common/errors/eco-error'
import { AlchemyConfigType } from '../../eco-configs/eco-config.types'

export const TEST_HEX_NONCE_2D = '0x5e7f1725e7734ce288f8367e1bb143e90bb3f05120000000000000001'
export const TEST_HEX_NONCE_2D_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512'

jest.mock('ethers', () => {
  return {
    ...jest.requireActual('ethers'),
    ethers: {
      ...jest.requireActual('ethers').ethers,
      AbiCoder: {
        defaultAbiCoder: mockedAbiCoder,
      },
    },
  }
})
describe('AlchemyService', () => {
  let alchemyService: AlchemyService
  let ecoConfigService: DeepMocked<EcoConfigService>
  let alchemyMod: TestingModule
  const unsupportedNetwork = Network.ARB_GOERLI
  const baseNetwork = Network.BASE_SEPOLIA
  const ac: AlchemyConfigType = {
    authToken: 'authasdf',
    default: {
      network: baseNetwork,
      apiKey: 'coolkey',
    },
    secondary: [
      {
        network: Network.OPT_SEPOLIA,
        apiKey: 'aaa-op',
      },
    ],
  }
  const config = {
    privateKey: '0x17226185c7a8e77f9258a1239e387b2ca9076ba8ab77a67dac7ed3ef9e936e26',
    alchemy: ac,
  }

  beforeEach(async () => {
    alchemyMod = await Test.createTestingModule({
      providers: [
        AlchemyService,
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
      ],
    }).compile()

    alchemyService = alchemyMod.get<AlchemyService>(AlchemyService)
    ecoConfigService = alchemyMod.get<EcoConfigService>(
      EcoConfigService,
    ) as DeepMocked<EcoConfigService>

    ecoConfigService.getEth.mockReturnValue(config)
  })

  afterEach(async () => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
    await alchemyMod.close()
  })

  describe('when alchemy service initializing', () => {
    it('should initialize support for all the networks in the configuration', async () => {
      await alchemyMod.init()
      expect(alchemyService.supportedNetworks).toEqual([baseNetwork, Network.OPT_SEPOLIA])
    })
  })

  describe('when alchemy service initialized', () => {
    beforeEach(async () => {
      await alchemyMod.init()
    })

    describe('when getting alchemy', () => {
      it('should return an alchemy client for a supported network', async () => {
        const alchemy = alchemyService.getAlchemy(baseNetwork)
        expect(alchemy).toBeInstanceOf(Alchemy)
      })

      it('should throw on an alchemy client for a unsupported network', async () => {
        expect(() => alchemyService.getAlchemy(unsupportedNetwork)).toThrow(
          EcoError.AlchemyUnsupportedNetworkError(unsupportedNetwork),
        )
      })

      it('should return a supported provider network ', async () => {
        const provider = alchemyService.getProvider(baseNetwork)
        expect(provider).toBeInstanceOf(AlchemyProvider)
      })

      it('should throw on an unsupported provider network ', async () => {
        expect(() => alchemyService.getProvider(unsupportedNetwork)).toThrow(
          EcoError.AlchemyUnsupportedNetworkError(unsupportedNetwork),
        )
      })

      it('should return a wallet for a network', async () => {
        const wallet = alchemyService.getWallet(baseNetwork)
        expect(wallet).toBeInstanceOf(Wallet)
      })

      it('should throw on an unsupported wallet network ', async () => {
        expect(() => alchemyService.getWallet(unsupportedNetwork)).toThrow(
          EcoError.AlchemyUnsupportedNetworkError(unsupportedNetwork),
        )
      })
    })
  })
})
