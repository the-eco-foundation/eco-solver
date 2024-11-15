import * as config from 'config'

enum NodeEnv {
  Production = "production",
  Preproduction = "preproduction",
  Staging = "staging",
  Development = "development",
}

/**
 * Returns the NodeEnv enum value from the string node env, defaults to Development
 * 
 * @param env the string node env
 * @returns 
 */
function getNodeEnv(): NodeEnv {
  const env: string = config.util.getEnv('NODE_ENV')
  const normalizedEnv = env.toLowerCase() as keyof typeof NodeEnv
  return NodeEnv[normalizedEnv] || NodeEnv.Development
}


export { NodeEnv, getNodeEnv }