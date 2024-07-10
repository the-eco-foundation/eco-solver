export default {
  aws: {
    region: 'us-east-2',
    secretID: 'eco-solver-secrets',
  },
  redis: {
    connection: {
      host: 'localhost',
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
  },
  externalAPIs: {
    sentryDNS:
      'https://2bdbf18fde50475291703f27035fcbbd@o4505604587061248.ingest.us.sentry.io/4507573022556160',
  },
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
