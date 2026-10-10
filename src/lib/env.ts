/** Thrown when a secret required in production is missing from the environment. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

/**
 * Resolves a secret that must be explicitly configured in production but may
 * fall back to a well-known insecure value in local development. A deployment
 * that forgets to set it in production fails loudly with the variable's name
 * (never its value) instead of silently signing sessions/tokens with a value
 * nobody chose.
 */
export function requireProductionSecret(envVarName: string, devFallback: string): string {
  const value = process.env[envVarName]
  if (value) return value
  if (process.env.NODE_ENV === 'production') {
    throw new ConfigError(`${envVarName} environment variable is required in production.`)
  }
  console.warn(`${envVarName} is not set — using an insecure development fallback. Set ${envVarName} before deploying.`)
  return devFallback
}
