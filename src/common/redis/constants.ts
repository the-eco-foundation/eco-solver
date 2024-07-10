export const QUEUES: Record<any, QueueInterface> = {
  SOLVE_INTENT: {
    name: 'solve-intent',
    prefix: '{solver}',
    jobs: {
      token: 'solve-intent',
    },
  },
}

export interface QueueInterface {
  name: string
  prefix: string
  jobs: {
    token: string
  }
}
