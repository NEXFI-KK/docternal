import { Readable } from 'stream'
import { parseRouteConfig, RouteConfig, Site } from '../src/RouteConfig'

describe('RouteConfig test', () => {
  it('should parse valid docternal.yaml', async () => {
    const stream = new Readable()
    stream.push(VALID_DOCTERNAL_YAML)
    stream.push(null)

    const routeConfig = await parseRouteConfig(stream)
    expect(routeConfig.version).toBe(1)
    expect(routeConfig.sites).toEqual(
      expect.arrayContaining([
        {
          project: 'cool-sdk',
          domain: 'cool-sdk.mycompany.com',
          path: '',
          permissions: {
            domains: ['mycompany.com'],
            emails: ['contractor@devcompany.com'],
            localUsers: [],
          },
        },
        {
          project: 'other-sdk',
          domain: 'docsite.com',
          path: '/other-sdk',
          permissions: {
            domains:['mycompany.com'],
            emails: [],
            localUsers: ['user1', 'user2'],
          }
        },
      ]))
  })
  it('should authorize users by email', () => {
    expect(RouteConfig.canAccess('steve@company.com', {
      domain: 'docs.company.com',
      project: 'company-docs',
      path: '',
      permissions: {
        domains: [],
        emails: ['steve@company.com'],
        localUsers: [],
      }
    })).toBe(true)
  })
  it('should authorize users by local username', () => {
    expect(RouteConfig.canAccess('local_user_1', {
      domain: 'docs.company.com',
      project: 'company-docs',
      path: '',
      permissions: {
        domains: [],
        emails: [],
        localUsers: ['local_user_1'],
      }
    })).toBe(true)
  })
  it('should authorize users by email domain', () => {
    expect(RouteConfig.canAccess('steve@company.com', {
      domain: 'docs.company.com',
      project: 'company-docs',
      path: '',
      permissions: {
        domains: ['company.com'],
        emails: [],
        localUsers: [],
      }
    })).toBe(true)
  })
  it('should reject unauthorized users', () => {
    expect(RouteConfig.canAccess('bob@organization.org', {
      domain: 'docs.company.com',
      project: 'company-docs',
      path: '',
      permissions: {
        domains: ['company.com'],
        emails: [],
        localUsers: [],
      }
    })).toBe(false)
  })
})

const VALID_DOCTERNAL_YAML = `
version: 1
sites:

  # cool-sdk.mycompany.com/en/latest
  - project: cool-sdk
    domain: cool-sdk.mycompany.com
    permissions:
      domains:
        - mycompany.com
      emails:
        - contractor@devcompany.com

  # docsite.com/other-sdk/en/latest
  - project: other-sdk
    domain: docsite.com
    path: /other-sdk
    permissions:
      domains:
        - mycompany.com
      local_users:
        - user1
        - user2
`
