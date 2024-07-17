export const QUEUES = {
  CREATE_INTENT: {
    queue: 'create_intent',
    prefix: '{solver-create-intent}',
    jobs: {
      create_intent: 'create_intent',
    },
  },
}

export interface QueueInterface {
  queue: string
  prefix: string
  jobs: Record<string, string>
}
