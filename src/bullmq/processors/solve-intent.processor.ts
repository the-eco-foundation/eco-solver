import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { EcoLogMessage } from '../../common/logging/eco-log-message'
import { ViemEventLog, SourceIntentTxHash } from '../../common/events/websocket'
import { FeasableIntentService } from '../../intent/feasable-intent.service'
import { ValidateIntentService } from '../../intent/validate-intent.service'
import { CreateIntentService } from '../../intent/create-intent.service'
import { FulfillIntentService } from '../../intent/fulfill-intent.service'

@Injectable()
@Processor(QUEUES.SOURCE_INTENT.queue)
export class SolveIntentProcessor extends WorkerHost {
  private logger = new Logger(SolveIntentProcessor.name)
  constructor(
    private readonly createIntentService: CreateIntentService,
    private readonly validateIntentService: ValidateIntentService,
    private readonly feasableIntentService: FeasableIntentService,
    private readonly fulfillIntentService: FulfillIntentService,
  ) {
    super()
  }

  async process(
    job: Job<any, any, string>,
    processToken?: string | undefined, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<any> {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `SolveIntentProcessor: process`,
        properties: {
          job: job.name,
        },
      }),
    )

    switch (job.name) {
      case QUEUES.SOURCE_INTENT.jobs.create_intent:
        return await this.createIntentService.createIntent(job.data as ViemEventLog)
      case QUEUES.SOURCE_INTENT.jobs.validate_intent:
        return await this.validateIntentService.validateIntent(job.data as SourceIntentTxHash)
      case QUEUES.SOURCE_INTENT.jobs.feasable_intent:
        return await this.feasableIntentService.feasableIntent(job.data as SourceIntentTxHash)
      case QUEUES.SOURCE_INTENT.jobs.fulfill_intent:
        return await this.fulfillIntentService.executeFulfillIntent(job.data as SourceIntentTxHash)
      default:
        this.logger.error(
          EcoLogMessage.fromDefault({
            message: `SolveIntentProcessor: Invalid job type ${job.name}`,
          }),
        )
        return Promise.reject('Invalid job type')
    }
  }

  @OnWorkerEvent('failed')
  onJobFailed(job: Job<any, any, string>, error: Error) {
    this.logger.error(
      EcoLogMessage.fromDefault({
        message: `SolveIntentProcessor: Error processing job`,
        properties: {
          job,
          error,
        },
      }),
    )
  }
}
