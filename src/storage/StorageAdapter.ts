import { Readable } from 'stream'

/**
 * Sotrage bucket adapter interface for accessing the underlying documentation bucket.
 */
export interface StorageAdapter {
  /**
   * List all the subdirectories under a given path in the bucket.
   * @param fileName Path to list subdirectories under.
   * @return List of subdirectories.
   */
  listSubdirs(fileName: string): Promise<string[]>

  /**
   * Open a file and get a read stream to it.
   * @param fileName Path to the file within the bucket.
   * @return Read stream to the file.
   * @throws {FileNotFound} if the file doesn't exist.
   */
  openFile(fileName: string): Promise<Readable>
}

export class FileNotFound extends Error {}
