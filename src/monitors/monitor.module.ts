import { Module } from '@nestjs/common'
import { AlchemyWebhookGuard } from './guards/alchemy-webhook.guard'
import { MonitorService } from './services/monitor.service'
import { MonitorController } from './controllers/monitor.controller'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { IntentModule } from '../intent/intent.module'

@Module({
  imports: [EcoConfigModule, IntentModule],

  controllers: [MonitorController],

  providers: [AlchemyWebhookGuard, MonitorService],

  exports: [AlchemyWebhookGuard, MonitorService],
})
export class MonitorModule {}
