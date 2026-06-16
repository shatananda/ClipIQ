import fs from 'fs';
import path from 'path';

interface BlobConfig {
  bucket?: string;
}

export async function uploadFile(
  filePath: string,
  blobKey: string,
  config?: BlobConfig
): Promise<string> {
  // Use local filesystem for all environments (development and Railway production)
  return filePath;
}

export async function downloadFile(blobUrl: string, localPath: string): Promise<string> {
  // Use local filesystem for all environments
  return localPath;
}

export async function deleteFile(blobKey: string): Promise<void> {
  // Use local filesystem for all environments
  return;
}

export function getBlobKey(type: 'video' | 'clip' | 'transcript', identifier: string): string {
  const timestamp = Date.now();
  return `clipiq/${type}/${identifier}-${timestamp}`;
}

export function getLocalPath(type: 'video' | 'audio' | 'clip', identifier: string): string {
  const baseDir = path.join(process.cwd(), 'storage');
  return path.join(baseDir, type, `${identifier}.${type === 'clip' ? 'mp4' : type === 'audio' ? 'm4a' : 'mp4'}`);
}
