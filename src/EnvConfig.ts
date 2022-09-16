import { stringify } from "querystring"

/**
 * Configuration loaded from environment variables.
 */
export type EnvConfig = {
  /**
   * Port to listen on.
   */
  PORT: number
  /**
   * S3 bucket name where documentation is stored.
   */
  S3_BUCKET_NAME: string
  /**
   * AWS region where the bucket is hosted.
   */
  AWS_REGION: string
  /**
   * AWS Access Key ID
   */
  AWS_ACCESS_KEY_ID: string
  /**
   * AWS Secret Access Key
   */
  AWS_SECRET_ACCESS_KEY: string
  /**
   * Root path in the S3 bucket where documentation is stored.
   */
  ROOT_DOCS_PATH: string
  /**
   * List of local accounts in `username:password` format.
   * Multiple entries can be separated by commas.
   */
  LOCAL_USERS: LocalUser[]
  /**
   * Google OAuth client ID if using Google login.
   */
  GOOGLE_CLIENT_ID: string
  /**
   * Google OAuth client secret if using Google login.
   */
  GOOGLE_CLIENT_SECRET: string
  /**
   * Google OAuth callback URL if using Google login.
   * Should be `https://{your_domain}/auth/google/callback` in most cases.
   */
  GOOGLE_CALLBACK_URL: string
  /**
   * Azure Active Directory OAuth client ID if using Microsoft login.
   */
  MICROSOFT_CLIENT_ID: string
  /**
   * Azure Active Directory OAuth callback if using Microsoft login.
   * Should be `https://{your_domain}/auth/microsoft/callback` in most cases.
   */
  MICROSOFT_CALLBACK_URL: string
}

export type LocalUser = {
  username: string
  password: string
}

/**
 * Load config from environment variables.
 * @param env Environment variables to read config from. Defaults to `process.env` if left undefined.
 * @return {EnvConfig} parsed from environment variables.
 * @throws {MissingEnvError} if a required parameter was missing.
 */
export function loadEnvConfig(env?: NodeJS.ProcessEnv): EnvConfig {
  env = env || process.env
  return {
    PORT: parseInt(env.PORT || '8080'),
    S3_BUCKET_NAME: requiredEnv(env, 'S3_BUCKET_NAME'),
    AWS_REGION: requiredEnv(env, 'AWS_REGION'),
    AWS_ACCESS_KEY_ID: requiredEnv(env, 'AWS_ACCESS_KEY_ID'),
    AWS_SECRET_ACCESS_KEY: requiredEnv(env, 'AWS_SECRET_ACCESS_KEY'),
    ROOT_DOCS_PATH: env.ROOT_DOCS_PATH || '',
    LOCAL_USERS: parseLocalUsers(env.LOCAL_USERS),
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_CALLBACK_URL: env.GOOGLE_CALLBACK_URL || '',
    MICROSOFT_CLIENT_ID: env.MICROSOFT_CLIENT_ID || '',
    MICROSOFT_CALLBACK_URL: env.MICROSOFT_CALLBACK_URL || '',
  }
}

/**
 * @param usersStr Local account credentials string in the form of username:password pairs separated by commas.
 * @returns Parsed map of username => password pairs.
 */
export function parseLocalUsers(usersStr?: string): LocalUser[] {
  if (!usersStr) {
    return []
  }
  return usersStr.split(',').filter(s => !!s).map((s: string) => {
    const user = s.split(':')
    return {
      username: user[0],
      password: user[1],
    }
  })
}

export class MissingEnvError extends Error {}

function requiredEnv(env: NodeJS.ProcessEnv, varName: string): string {
  const ret = env[varName]
  if (!ret) {
    throw new MissingEnvError(`${varName} environment variable is required`)
  }
  return ret
}
