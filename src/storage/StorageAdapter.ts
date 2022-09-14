import { Readable } from 'stream'

/**
 * Sotrage bucket adapter interface for accessing the underlying documentation bucket.
 */
export interface StorageAdapter {
  /**
   * List all the subdirectories under a given path in the bucket.
   * @param path Path to list subdirectories under.
   * @return List of subdirectories.
   */
  listSubdirs(path: string): Promise<string[]>

  /**
   * Open a file and get a read stream to it.
   * @param fileName Path to the file within the bucket.
   * @return Read stream to the file.
   */
  openFile(fileName: string): Promise<Readable>
}
