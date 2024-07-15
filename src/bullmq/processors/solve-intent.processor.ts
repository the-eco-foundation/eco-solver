import { Processor, WorkerHost } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { EcoLogMessage } from '../../common/logging/eco-log-message'
import { SoucerIntentService } from '../../source-intent/source-intent.service'

@Injectable()
@Processor(QUEUES.SOLVE_INTENT.queue)
export class SolveIntentProcessor extends WorkerHost {
  private logger = new Logger(SolveIntentProcessor.name)
  constructor(private readonly sourceIntentService: SoucerIntentService) {
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
      case QUEUES.SOLVE_INTENT.jobs.token:
      const intentData = job.data
      return await this.sourceIntentService.fillIntent(intentData)
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
