import { parse } from 'path'
import { Readable } from 'stream'
import YAML from 'yaml'

/**
 * Site type describing a project site's route.
 */
export type Site = {
  /**
   * Project name. Defines which folder to find the project in.
   */
  project: string
  /**
   * Domain name where the project documentation will be available.
   */
  domain: string
  /**
   * Path where the project documentation will be available.
   */
  path: string
}

/**
 * Routing configuration to be loaded from the S3 bucket's root directory.
 * Defines the routing and permissions rules for each documentation site.
 */
export class RouteConfig {
  /**
   * Route config version. Always 1 as of now.
   */
  version: number
  /**
   * Site config list.
   */
  sites: Site[]

  constructor(version: number, sites: Site[]) {
    this.version = version
    this.sites = [...sites]
  }

  /**
   * Select the specific Site configuration that applies to a request.
   * @param hostname The hostname of the incoming request.
   * @param path The path part of the incoming request.
   * @return The selected Site, or null if none is applicable.
   */
  selectSite(hostname: string, path: string): Site | null {
    for (const site of this.sites) {
      if (site.domain === hostname) {
        return site
      }
    }
    return null
  }
}

/**
 * Parse the route configuration from a stream.
 * @param stream Readable stream to parse from.
 * @returns RouteConfig object.
 * @throws {RouteConfigError} if the route configuration is invalid.
 */
export async function parseRouteConfig(stream: Readable): Promise<RouteConfig> {
  const parsed = YAML.parse(await streamToString(stream))

  if (parsed.version !== 1) {
    throw new RouteConfigError('wrong version')
  }
  if (!parsed.sites) {
    throw new RouteConfigError('missing sites key')
  }

  return new RouteConfig(parsed.version, parsed.sites)
}

export class RouteConfigError extends Error {}

async function streamToString (stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}