import { Module } from '@nestjs/common'
import { EventMonitorService } from './event-monitor.service'
import { EcoConfigModule } from '../eco-configs/eco-config.module'

@Module({
  imports: [EcoConfigModule],
  providers: [EventMonitorService],
  exports: [EventMonitorService],
})
export class ChainMonitorModule {}
