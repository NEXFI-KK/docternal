import { Readable } from 'stream'
import { parseRouteConfig, Site } from '../src/RouteConfig'

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
          permissions: new Map([
            [
              'google',
              { domains: ['mycompany.com'], emails: ['contractor@devcompany.com'] },
            ],
            [
              'microsoft',
              { domains: ['favorite-partner.com'], emails: [] },
            ],
          ]),
        },
        {
          project: 'other-sdk',
          domain: 'docsite.com',
          path: '/other-sdk',
          permissions: new Map([
            [
              'google',
              { domains: ['mycompany.com'], emails: [] },
            ],
            [
              'local_users',
              { domains: [], emails: ['user1', 'user2'] },
            ],
          ])
        },
      ]))
  })
})

const VALID_DOCTERNAL_YAML = `
version: 1
sites:

  # cool-sdk.mycompany.com/en/latest
  - project: cool-sdk
    domain: cool-sdk.mycompany.com
    permissions:
      google:
        domains:
          - mycompany.com
        emails:
          - contractor@devcompany.com
      microsoft:
        domains: favorite-partner.com

  # docsite.com/other-sdk/en/latest
  - project: other-sdk
    domain: docsite.com
    path: /other-sdk
    permissions:
      google:
        domains:
          - mycompany.com
      local_users:
        emails:
          - user1
          - user2
`
