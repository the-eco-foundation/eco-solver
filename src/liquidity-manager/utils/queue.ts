import { Queue } from 'bullmq'

export async function removeRepeatableJobs(queue: Queue, jobName: string) {
  const repeatableJobs = await queue.getRepeatableJobs()

  for (const job of repeatableJobs) {
    if (job.name === jobName) {
      await queue.removeRepeatableByKey(job.key)
    }
  }
}
