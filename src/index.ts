import * as dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response } from 'express'
import session from 'express-session'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import path from 'path'
import { parseRouteConfig, RouteConfig, RouteConfigError } from './RouteConfig'
import initAuth, { DocternalUser } from './auth'
import { initAPI } from './api'
import { ensureLoggedIn } from 'connect-ensure-login'
import { EnvConfig, loadEnvConfig } from './EnvConfig'
import { exit } from 'process'
import { S3StorageAdapter } from './storage/S3StorageAdapter'
import { FileNotFound } from './storage/StorageAdapter'

console.log('Docternal starting up...')

const app = express()
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'test secret',
  resave: false,
  saveUninitialized: false,
  store: new session.MemoryStore(),
}))
app.use(passport.authenticate('session'))
app.use(passport.initialize())
app.use(passport.session())

let envConfig: EnvConfig
try {
  envConfig = loadEnvConfig()
} catch (e) {
  console.error(e)
  exit(1)
}

const storage = new S3StorageAdapter(envConfig.S3_BUCKET_NAME)

initAuth(app, envConfig)
initAPI(app, storage, envConfig)

async function loadRouteConfig(): Promise<RouteConfig> {
  const routeFile = await storage.openFile(path.join(envConfig.ROOT_DOCS_PATH, 'docternal.yaml'))
  return await parseRouteConfig(routeFile)
}

app.get('/', [ensureLoggedIn()], async (req: Request, res: Response) => {
  let routeConfig: RouteConfig
  try {
    routeConfig = await loadRouteConfig()

    const currentSite = routeConfig.selectSite(req.hostname, req.path)
    if (currentSite) {
      return res.render('languages', {
        project: currentSite.project,
        languages: await storage.listSubdirs(path.join(envConfig.ROOT_DOCS_PATH, currentSite.project, '/')),
      })
    }

    return res.render('index', {
      sites: routeConfig.sites.map(site => ({
        title: site.project,
        href: `${req.protocol}://${site.domain}/${site.path || ''}`,
      })),
    })
  } catch (e: any) {
    if (e instanceof FileNotFound) {
      return res.status(500).render('error', {
        message: 'Bucket not properly configured: No docternal.yaml file found',
      })
    } else if (e instanceof RouteConfigError) {
      return res.status(500).render('error', {
        message: `Bucket not properly configured: ${e.message}`,
      })
    }
    return res.status(500).render('error', { message: e.stack })
  }
})

app.get('/:lang', [ensureLoggedIn()], async (req: Request, res: Response) => {
  try {
    const routeConfig = await loadRouteConfig()
    const currentSite = routeConfig.selectSite(req.hostname, req.path)
    if (currentSite) {
      return res.render('versions', {
        project: currentSite.project,
        language: req.params.lang,
        versions: await storage.listSubdirs(path.join(
          envConfig.ROOT_DOCS_PATH,
          currentSite.project,
          req.params.lang,
          '/',
        )),
      })
    }
  } catch (e: any) {
    res.status(500).send(e.message)
  }
})

app.get('/:lang/:version*', [ensureLoggedIn()], async (req: Request, res: Response) => {
  // Load route config on each request so it's always up to date
  let routeConfig: RouteConfig
  try {
    routeConfig = await loadRouteConfig()
  } catch (e: any) {
    if (e instanceof FileNotFound) {
      return res.status(500).render('error', {
        message: 'Bucket not properly configured: No docternal.yaml file found',
      })
    } else if (e instanceof RouteConfigError) {
      return res.status(500).render('error', {
        message: `Bucket not properly configured: ${e.message}`,
      })
    }
    return res.status(500).render('error', { message: e.stack })
  }

  // Select site based on domain and path
  const site = routeConfig.selectSite(req.hostname, req.path)
  if (!site) {
    return res.status(404).send('not found')
  }

  // Reject users who shouldn't view the docs
  const user = req.user as DocternalUser
  if (!RouteConfig.canAccess(user.email, site)) {
    return res.status(401).send('unauthorized')
  }

  // Determine full path of resource inside S3
  const resourcePath = path.join(envConfig.ROOT_DOCS_PATH, site.project, req.path)
  if (path.extname(resourcePath) === '') {
    return res.redirect(path.join('/', req.path, 'index.html'))
  }

  // Pipe resource from S3 to response
  try {
    const body = await storage.openFile(resourcePath)
    body.pipe(res)
  } catch (e: any) {
    if (e instanceof FileNotFound) {
      return res.status(404).send('not found')
    }
    return res.status(500).send(e.message)
  }
})

app.listen(envConfig.PORT, () => {
  console.log(`Docternal listening on port ${envConfig.PORT}`)
})
