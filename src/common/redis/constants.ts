export const QUEUES = {
  SOURCE_INTENT: {
    queue: 'source_intent',
    prefix: '{source-intent}',
    jobs: {
      create_intent: 'create_intent',
      validate_intent: 'validate_intent',
      feasable_intent: 'feasable_intent',
      profitable_intent: 'profitable_intent',
    },
  },
  SOLVER: {
    queue: 'solver',
    prefix: '{solver}',
    jobs: {},
  },
}

export interface QueueInterface {
  queue: string
  prefix: string
  jobs: Record<string, string>
}
