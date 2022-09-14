import { loadEnvConfig, MissingEnvError, parseLocalUsers } from "../src/EnvConfig"

describe('Username/password parse test', () => {
  it('parses single user', () => {
    const users = parseLocalUsers('user1:pass1')
    expect(users).toEqual([
      {
        username: 'user1',
        password: 'pass1',
      },
    ])
  })
  it('parses multiple users', () => {
    const users = parseLocalUsers('user1:pass1,user2:pass2')
    expect(users).toEqual([
      {
        username: 'user1',
        password: 'pass1',
      },
      {
        username: 'user2',
        password: 'pass2',
      }
    ])
  })
  it('handles extraneous commas', () => {
    const users = parseLocalUsers(',user1:pass1,')
    expect(users).toEqual([
      {
        username: 'user1',
        password: 'pass1',
      },
    ])
  })
  it('handles empty input', () => {
    expect(parseLocalUsers('')).toEqual([])
    expect(parseLocalUsers(undefined)).toEqual([])
  })
})

describe('EnvConfig test', () => {
  it('parses valid environment config and fills in defaults', () => {
    const config = loadEnvConfig({
      S3_BUCKET_NAME: 'bucket',
      AWS_REGION: 'ap-northeast-1',
      AWS_ACCESS_KEY_ID: '1234567890',
      AWS_SECRET_ACCESS_KEY: 'abcdefghijklmnopqrstuvwxyz',
    })
    expect(config).toEqual({
      PORT: 8080,
      S3_BUCKET_NAME: 'bucket',
      AWS_REGION: 'ap-northeast-1',
      AWS_ACCESS_KEY_ID: '1234567890',
      AWS_SECRET_ACCESS_KEY: 'abcdefghijklmnopqrstuvwxyz',
      ROOT_DOCS_PATH: '',
      LOCAL_USERS: [],
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      GOOGLE_CALLBACK_URL: '',
    })
  })
  it('parses valid environment config and overrides defaults', () => {
    const config = loadEnvConfig({
      PORT: '3000',
      S3_BUCKET_NAME: 'bucket',
      AWS_REGION: 'ap-northeast-1',
      AWS_ACCESS_KEY_ID: '1234567890',
      AWS_SECRET_ACCESS_KEY: 'abcdefghijklmnopqrstuvwxyz',
      LOCAL_USERS: 'user1:pass1,user2:pass2',
      GOOGLE_CLIENT_ID: '1234567890',
      GOOGLE_CLIENT_SECRET: 'abcdefghijklmnopqrstuvwxyz',
      GOOGLE_CALLBACK_URL: 'https://mydocsite.com/auth/google/callback',
    })
    expect(config).toEqual({
      PORT: 3000,
      S3_BUCKET_NAME: 'bucket',
      AWS_REGION: 'ap-northeast-1',
      AWS_ACCESS_KEY_ID: '1234567890',
      AWS_SECRET_ACCESS_KEY: 'abcdefghijklmnopqrstuvwxyz',
      ROOT_DOCS_PATH: '',
      LOCAL_USERS: [
        {
          username: 'user1',
          password: 'pass1',
        },
        {
          username: 'user2',
          password: 'pass2',
        },
      ],
      GOOGLE_CLIENT_ID: '1234567890',
      GOOGLE_CLIENT_SECRET: 'abcdefghijklmnopqrstuvwxyz',
      GOOGLE_CALLBACK_URL: 'https://mydocsite.com/auth/google/callback',
    })
  })
  it('throws error when missing required settings', () => {
    expect(() => loadEnvConfig({})).toThrow(MissingEnvError)
  })
})