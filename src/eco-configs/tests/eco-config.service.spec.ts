import { DeepMocked, createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { EcoConfigService } from '../eco-config.service'
import { AwsConfigService } from '../aws-config.service'

describe('Eco Config Helper Tests', () => {
  let ecoConfigService: EcoConfigService
  let awsConfigService: DeepMocked<AwsConfigService>
  let mockLog: jest.Mock
  const awsConfig = { aws: { faceAws: 'asdf', region: 'not-a-region' } }
  beforeEach(async () => {
    awsConfigService = createMock<AwsConfigService>()
    awsConfigService.getConfig = jest.fn().mockReturnValue(awsConfig)
    const configMod: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EcoConfigService,
          useFactory: async (awsConfigService: AwsConfigService) => {
            await awsConfigService.initConfigs()
            return new EcoConfigService([awsConfigService])
          },
          inject: [AwsConfigService],
        },
        { provide: AwsConfigService, useValue: awsConfigService },
      ],
    }).compile()

    ecoConfigService = configMod.get<EcoConfigService>(EcoConfigService)
    mockLog = jest.fn()
  })

  it('should merge configs correctly', async () => {
    const oldConfig = ecoConfigService.get('aws') as any
    ecoConfigService.onModuleInit()
    expect(ecoConfigService.get('aws')).toEqual({
      ...awsConfig.aws,
      ...oldConfig,
    })
  })
})
