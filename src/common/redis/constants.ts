export const QUEUES = {
  SOURCE_INTENT: {
    queue: 'source_intent',
    prefix: '{solver-source-intent}',
    jobs: {
      create_intent: 'create_intent',
      process_intent: 'process_intent',
    },
  },
}

export interface QueueInterface {
  queue: string
  prefix: string
  jobs: Record<string, string>
}
