export default {
  aws: {
    region: 'us-east-2',
    secretID: 'eco-solver-secrets',
  },
  database: {
    auth: {
      enabled: false,
      username: '',
      password: '',
      type: '',
    },

    uriPrefix: 'mongodb://',
    uri: 'localhost:27017',
    dbName: 'eco-solver-local',
    enableJournaling: true,
  },
  redis: {
    connection: {
      host: 'localhost',
      port: 6379,
    },
    options: {
      single: {
        autoResubscribe: true,
        autoResendUnfulfilledCommands: true,
        tls: {},
      },
      cluster: {
        enableReadyCheck: true,
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 1000,
        retryDelayOnTryAgain: 3000,
        slotsRefreshTimeout: 10000,
        clusterRetryStrategy: (times: number): number => Math.min(times * 1000, 10000),
        dnsLookup: (address: string, callback: any) => callback(null, address, 6),
      },
    },
    redlockSettings: {
      driftFactor: 0.01,
      retryCount: 3,
      retryDelay: 200,
      retryJitter: 200,
    },
    jobs: {
      intentJobConfig: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    },
  },
  externalAPIs: {},
  logger: {
    usePino: true,
    pinoConfig: {
      pinoHttp: {
        useLevel: 'debug',
        useLevelLabels: true,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.accept',
            'req.headers["cache-control"]',
            'req.headers["accept-encoding"]',
            'req.headers["content-type"]',
            'req.headers["content-length"]',
            'req.headers.connection',
            'res.headers',
            'err.stack',
          ],
          remove: true,
        },
      },
    },
  },
}
