import { Module } from '@nestjs/common'
import { EcoConfigService } from './eco-config.service'
import { AwsConfigService } from './aws-config.service'

@Module({
  providers: [
    {
      provide: EcoConfigService,
      useFactory: async (awsConfigService: AwsConfigService) => {
        await awsConfigService.initConfigs()
        return new EcoConfigService(awsConfigService)
      },
      inject: [AwsConfigService],
    },
    AwsConfigService,
  ],
  exports: [EcoConfigService, AwsConfigService],
})
export class EcoConfigModule {}
