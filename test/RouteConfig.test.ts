import { Readable } from 'stream'
import { parseRouteConfig } from '../src/RouteConfig'

describe('RouteConfig test', () => {
  it('should parse valid docternal.yaml', async () => {
    const stream = new Readable()
    stream.push(VALID_DOCTERNAL_YAML)
    stream.push(null)

    const routeConfig = await parseRouteConfig(stream)
    expect(routeConfig.version).toBe(1)
    expect(routeConfig.sites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          project: 'cool-sdk',
          domain: 'cool-sdk.mycompany.com',
          path: '',
        }),
        expect.objectContaining({
          project: 'other-sdk',
          domain: 'docsite.com',
          path: '/other-sdk'
        }),
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
        domains: mycompany.com
      microsoft:
        domains: favorite-partner.com

  # docsite.com/other-sdk/en/latest
  - project: other-sdk
    domain: docsite.com
    path: /other-sdk
    permissions:
      google:
        domains: mycompany.com
      basic_auth:
        username: doc-viewer@dinosaur.com
        password: <Bcrypt password hash>
`
