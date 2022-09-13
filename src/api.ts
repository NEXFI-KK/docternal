import path from 'path'
import { Application, Request, Response } from 'express'
import { S3Client, ListObjectsV2Command, _Object, CommonPrefix } from '@aws-sdk/client-s3'
import { ensureLoggedIn } from 'connect-ensure-login'

export function initAPI(app: Application, s3Client: S3Client, bucket: string, rootPath: string) {
  app.get('/api/:appName/languages', [ensureLoggedIn()], async (req: Request, res: Response) => {
    const ret = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Delimiter: '/',
      Prefix: path.join(rootPath, req.params.appName, '/'),
    }))
    res.json({
      languages: ret.CommonPrefixes?.map((c: CommonPrefix) => path.basename(String(c.Prefix))),
    })
  })
  
  app.get('/api/:appName/:lang/versions', [ensureLoggedIn()], async (req: Request, res: Response) => {
    const ret = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Delimiter: '/',
      Prefix: path.join(rootPath, req.params.appName, req.params.lang, '/'),
    }))
    res.json({
      versions: ret.CommonPrefixes?.map((c: CommonPrefix) => path.basename(String(c.Prefix))),
    })
  })
}