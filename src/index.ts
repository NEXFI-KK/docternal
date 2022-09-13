import express, { Request, Response } from 'express'
import session from 'express-session'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import { S3Client, GetObjectCommand, NoSuchKey, _Object } from '@aws-sdk/client-s3'
import path from 'path'
import { parseRouteConfig, RouteConfig, RouteConfigError } from './RouteConfig'
import { Readable } from 'stream'
import initAuth from './auth'
import { initAPI } from './api'
import { ensureLoggedIn } from 'connect-ensure-login'

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

app.get('/', [ensureLoggedIn()], async (req: Request, res: Response) => {
  let routeConfig: RouteConfig
  try {
    routeConfig = await loadRouteConfig()

    return res.render('index', {
      sites: routeConfig.sites.map(site => ({
        title: site.project,
        href: `${req.protocol}://${site.domain}/${site.path || ''}`,
      })),
    })
  } catch (e: any) {
    if (e instanceof NoSuchKey) {
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

initAuth(app)

const port = process.env.PORT || 8080
const bucket = process.env.S3_BUCKET_NAME as string
const rootPath = process.env.ROOT_DOCS_PATH || ''

const s3Client = new S3Client({});

initAPI(app, s3Client, bucket, rootPath)

async function loadRouteConfig(): Promise<RouteConfig> {
  const ret = await s3Client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: path.join(rootPath, 'docternal.yaml'),
  }))
  if (ret.Body) {
    return await parseRouteConfig(ret.Body as Readable)
  }
  throw new Error('no response body')
}

app.get('/:lang/:version/*', [ensureLoggedIn()], async (req: Request, res: Response) => {
  // Load route config on each request so it's always up to date
  let routeConfig: RouteConfig
  try {
    routeConfig = await loadRouteConfig()
  } catch (e: any) {
    if (e instanceof NoSuchKey) {
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

  // TODO: Select site based on domain and path
  const site = routeConfig.selectSite(req.hostname, req.path)
  if (!site) {
    return res.status(404).send('not found')
  }

  // Determine full path of resource inside S3
  const resourcePath = path.join(rootPath, site.project, req.path)
  if (path.extname(resourcePath) === '') {
    return res.redirect(path.join('/', req.path, 'index.html'))
  }

  // Pipe resource from S3 to response
  try {
    const ret = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: resourcePath,
    }))
    const body = ret.Body as Readable
    body.pipe(res)
  } catch (e: any) {
    if (e instanceof NoSuchKey) {
      return res.status(404).send('not found')
    }
    return res.status(500).send(e.message)
  }
})

app.listen(port, () => {
  console.log(`Docternal listening on port ${port}`)
})
