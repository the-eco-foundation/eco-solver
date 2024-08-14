import { Processor, WorkerHost } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { EcoLogMessage } from '../../common/logging/eco-log-message'
import { SourceIntentService } from '../../source-intent/source-intent.service'
import { EventLogWS, SourceIntentTxHash } from '../../common/events/websocket'

@Injectable()
@Processor(QUEUES.SOURCE_INTENT.queue)
export class SolveIntentProcessor extends WorkerHost {
  private logger = new Logger(SolveIntentProcessor.name)
  constructor(private readonly sourceIntentService: SourceIntentService) {
    super()
  }

  async process(
    job: Job<any, any, string>,
    processToken?: string | undefined, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<any> {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `SolveIntentProcessor: process`,
      }),
    )

    switch (job.name) {
      case QUEUES.SOURCE_INTENT.jobs.create_intent:
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `SolveIntentProcessor: ws event`,
            properties: {
              event: job.data,
            },
          }),
        )
        return await this.sourceIntentService.createIntent(job.data as EventLogWS)
      case QUEUES.SOURCE_INTENT.jobs.validate_intent:
        return await this.sourceIntentService.validateIntent(job.data as SourceIntentTxHash)
      case QUEUES.SOURCE_INTENT.jobs.feasable_intent:
        return await this.sourceIntentService.feasableIntent(job.data as SourceIntentTxHash)
      default:
        this.logger.error(
          EcoLogMessage.fromDefault({
            message: `SolveIntentProcessor: Invalid job type ${job.name}`,
          }),
        )
        return Promise.reject('Invalid job type')
    }
  }
}
