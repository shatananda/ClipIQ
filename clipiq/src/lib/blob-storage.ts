import fs from 'fs';
import path from 'path';

// Use Vercel Blob in production, local filesystem in development
const isProduction = process.env.NODE_ENV === 'production';

interface BlobConfig {
  bucket?: string; // For future multi-bucket support
}

export async function uploadFile(
  filePath: string,
  blobKey: string,
  config?: BlobConfig
): Promise<string> {
  if (!isProduction) {
    // Development: just return the local file path
    return filePath;
  }

  // Production: upload to Vercel Blob
  try {
    // @ts-ignore - @vercel/blob only available in production
    const { put } = await import('@vercel/blob');
    const fileContent = fs.readFileSync(filePath);
    const blob = await put(blobKey, fileContent, { access: 'public' });
    return blob.url;
  } catch (error) {
    console.error('Blob upload failed:', error);
    throw error;
  }
}

export async function downloadFile(blobUrl: string, localPath: string): Promise<string> {
  if (!isProduction) {
    return localPath;
  }

  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(localPath, Buffer.from(buffer));
    return localPath;
  } catch (error) {
    console.error('Blob download failed:', error);
    throw error;
  }
}

export async function deleteFile(blobKey: string): Promise<void> {
  if (!isProduction) {
    // Development: delete from local filesystem
    return;
  }

  // Production: delete from Vercel Blob
  try {
    // @ts-ignore - @vercel/blob only available in production
    const { del } = await import('@vercel/blob');
    await del(blobKey);
  } catch (error) {
    console.error('Blob delete failed:', error);
    // Don't throw - deletion failures shouldn't block operations
  }
}

export function getBlobKey(type: 'video' | 'clip' | 'transcript', identifier: string): string {
  const timestamp = Date.now();
  return `clipiq/${type}/${identifier}-${timestamp}`;
}

export function getLocalPath(type: 'video' | 'audio' | 'clip', identifier: string): string {
  const baseDir = path.join(process.cwd(), 'storage');
  return path.join(baseDir, type, `${identifier}.${type === 'clip' ? 'mp4' : type === 'audio' ? 'm4a' : 'mp4'}`);
}
