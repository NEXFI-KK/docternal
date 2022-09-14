import path from 'path'
import { Application, Request, Response } from 'express'
import { ensureLoggedIn } from 'connect-ensure-login'
import { StorageAdapter } from './storage/StorageAdapter'

export function initAPI(app: Application, storage: StorageAdapter, bucket: string, rootPath: string) {
  app.get('/api/healthcheck', (req: Request, res: Response) => {
    res.status(200).json({ message: 'OK' })
  })

  app.get('/api/:appName/languages', [ensureLoggedIn()], async (req: Request, res: Response) => {
    const languages = await storage.listSubdirs(path.join(rootPath, req.params.appName, '/'))
    res.json({ languages })
  })
  
  app.get('/api/:appName/:lang/versions', [ensureLoggedIn()], async (req: Request, res: Response) => {
    const versions = await storage.listSubdirs(path.join(rootPath, req.params.appName, req.params.lang, '/'))
    res.json({ versions })
  })
}