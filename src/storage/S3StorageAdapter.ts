import { CommonPrefix, GetObjectCommand, ListObjectsV2Command, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import { Readable } from 'stream';
import { FileNotFound, StorageAdapter } from './StorageAdapter'

/**
 * AWS S3 implementation of StorageAdapter interface.
 */
export class S3StorageAdapter implements StorageAdapter {
  _s3Client: S3Client
  _bucketName: string

  /**
   * Construct an S3 storage adapter.
   * @param bucketName S3 bucket name to read from.
   * @param s3Client S3Client to use. Will create a default one if left empty.
   */
  constructor(bucketName: string, s3Client?: S3Client) {
    this._s3Client = s3Client || new S3Client({})
    this._bucketName = bucketName;
  }

  async listSubdirs(fileName: string): Promise<string[]> {
    const ret = await this._s3Client.send(new ListObjectsV2Command({
      Bucket: this._bucketName,
      Delimiter: '/',
      Prefix: fileName,
    }))
    return ret.CommonPrefixes?.map((c: CommonPrefix) => path.basename(String(c.Prefix))) || []
  }

  async openFile(fileName: string): Promise<Readable> {
    try {
      const ret = await this._s3Client.send(new GetObjectCommand({
        Bucket: this._bucketName,
        Key: fileName,
      }))
      return ret.Body as Readable
    } catch (e) {
      if (e instanceof NoSuchKey) {
        throw new FileNotFound()
      }
      throw e
    }
  }
}