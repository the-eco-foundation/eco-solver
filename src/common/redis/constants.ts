export const QUEUES: Record<any, QueueInterface> = {
  SOLVE_INTENT: {
    queue: 'solve-intent',
    prefix: '{solver}',
    jobs: {
      token: 'solve-intent',
    },
  },
}

export interface QueueInterface {
  queue: string
  prefix: string
  jobs: {
    token: string
  }
}
