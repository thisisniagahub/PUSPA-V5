import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export type UploadBucket = 'documents' | 'ekyc'

type UploadResult = {
  path: string
  url: string
  fileName: string
  size: number
  mimeType: string
}

const MAX_UPLOAD_BYTES: Record<UploadBucket, number> = {
  documents: 50 * 1024 * 1024,
  ekyc: 10 * 1024 * 1024,
}

const MIME_FALLBACKS: Record<string, string> = {
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

const DOCUMENT_MIME_ALLOWLIST = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
])

// Local storage directory (used in development)
const UPLOAD_ROOT = join(process.cwd(), 'uploads')

// Detect if Vercel Blob should be used
const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN

export function isUploadBucket(value: string): value is UploadBucket {
  return value === 'documents' || value === 'ekyc'
}

function inferMimeType(fileName: string) {
  const extension = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : ''
  return MIME_FALLBACKS[extension] || 'application/octet-stream'
}

function normalizeMimeType(fileName: string, mimeType: string) {
  return mimeType || inferMimeType(fileName)
}

function assertFileAllowed(bucket: UploadBucket, fileName: string, mimeType: string, size: number) {
  if (size <= 0) {
    throw new Error('Fail kosong tidak dibenarkan')
  }

  if (size > MAX_UPLOAD_BYTES[bucket]) {
    throw new Error(
      bucket === 'ekyc'
        ? 'Saiz fail eKYC melebihi had 10MB'
        : 'Saiz fail dokumen melebihi had 50MB',
    )
  }

  if (bucket === 'ekyc') {
    if (!mimeType.startsWith('image/')) {
      throw new Error('Hanya fail imej dibenarkan untuk eKYC')
    }
    return
  }

  const normalizedMimeType = normalizeMimeType(fileName, mimeType)
  if (!DOCUMENT_MIME_ALLOWLIST.has(normalizedMimeType)) {
    throw new Error('Jenis fail dokumen tidak dibenarkan')
  }
}

function sanitizeStem(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'file'
}

/**
 * Store a file upload.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise falls back to local filesystem.
 */
export async function storeUpload(options: {
  bucket: UploadBucket
  file: File
  scopeId?: string
}): Promise<UploadResult> {
  const { bucket, file, scopeId } = options
  const fileName = file.name || `${bucket}-upload`
  const mimeType = normalizeMimeType(fileName, file.type)
  const extension = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '.bin'
  const buffer = Buffer.from(await file.arrayBuffer())

  assertFileAllowed(bucket, fileName, mimeType, buffer.byteLength)

  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const scopeSuffix = scopeId ? `-${sanitizeStem(scopeId)}` : ''
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}${scopeSuffix}${extension}`
  const storagePath = `${year}/${month}/${storedName}`

  // Vercel Blob storage (production)
  if (useVercelBlob) {
    const { put } = await import('@vercel/blob')
    const blobKey = `${bucket}/${storagePath}`
    const blob = await put(blobKey, buffer, {
      access: 'public',
      contentType: mimeType,
    })

    return {
      path: `${bucket}/${storagePath}`,
      url: blob.url,
      fileName,
      size: buffer.byteLength,
      mimeType,
    }
  }

  // Local filesystem storage (development)
  const dirPath = join(UPLOAD_ROOT, bucket, year, month)
  await mkdir(dirPath, { recursive: true })

  const fullPath = join(UPLOAD_ROOT, bucket, storagePath)
  await writeFile(fullPath, buffer)

  return {
    path: `${bucket}/${storagePath}`,
    url: `/api/v1/upload/${bucket}/${storagePath}`,
    fileName,
    size: buffer.byteLength,
    mimeType,
  }
}

/**
 * Get a URL for a stored file (for downloads).
 * In local storage, files are served via the API route.
 * In Vercel Blob, files are already publicly accessible.
 */
export async function getSignedUrl(bucket: UploadBucket, storagePath: string, _expiresIn = 3600) {
  if (useVercelBlob) {
    // Vercel Blob URLs are already public — construct the URL from path
    // The `storeUpload` result already contains the full blob URL in the `url` field.
    // For lookups from storagePath, we return a placeholder; callers should use the stored URL.
    const { head } = await import('@vercel/blob')
    const blobKey = `${bucket}/${storagePath}`
    const blob = await head(blobKey)
    return blob?.url ?? `/api/v1/upload/${bucket}/${storagePath}`
  }

  // In local storage, we just return the API URL — no signed URLs needed
  return `/api/v1/upload/${bucket}/${storagePath}`
}

/**
 * Download a stored file.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise reads from local filesystem.
 */
export async function readStoredUpload(bucket: UploadBucket, storagePath: string) {
  const fileName = storagePath.split('/').pop() || 'file'
  const mimeType = inferMimeType(fileName)

  if (useVercelBlob) {
    const { head } = await import('@vercel/blob')
    const blobKey = `${bucket}/${storagePath}`
    const blob = await head(blobKey)

    if (!blob) {
      throw new Error(`Fail tidak dijumpai: ${storagePath}`)
    }

    // Fetch the blob content
    const response = await fetch(blob.url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return {
      bucket,
      storagePath,
      buffer,
      fileName,
      mimeType,
    }
  }

  // Local filesystem
  const fullPath = join(UPLOAD_ROOT, bucket, storagePath)
  const buffer = await readFile(fullPath)

  return {
    bucket,
    storagePath,
    buffer,
    fileName,
    mimeType,
  }
}

/**
 * Delete a stored file.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise deletes from local filesystem.
 */
export async function deleteStoredUpload(bucket: UploadBucket, storagePath: string) {
  if (useVercelBlob) {
    const { del } = await import('@vercel/blob')
    const blobKey = `${bucket}/${storagePath}`
    await del(blobKey)
    return
  }

  // Local filesystem
  const fullPath = join(UPLOAD_ROOT, bucket, storagePath)
  try {
    await unlink(fullPath)
  } catch (error) {
    throw new Error(`Gagal memadam fail: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function getMimeTypeForStoredFile(fileName: string) {
  return inferMimeType(fileName)
}
