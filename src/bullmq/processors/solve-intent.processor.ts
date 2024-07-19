import { Processor, WorkerHost } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { EcoLogMessage } from '../../common/logging/eco-log-message'
import { SourceIntentService } from '../../source-intent/source-intent.service'
import { SourceIntentWS } from '../../source-intent/dtos/SourceIntentWS'

@Injectable()
@Processor(QUEUES.CREATE_INTENT.queue)
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
      case QUEUES.CREATE_INTENT.jobs.create_intent:
        const intentData = job.data as SourceIntentWS
        return await this.sourceIntentService.createIntent(intentData)
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
