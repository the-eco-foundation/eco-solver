import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SAClientService } from './sa-client.service'

@Module({
  imports: [EcoConfigModule, SignModule],
  providers: [SAClientService],
  exports: [SAClientService],
})
export class TransactionModule {}
