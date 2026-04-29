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

// Local storage directory
const UPLOAD_ROOT = join(process.cwd(), 'uploads')

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
 * Store a file upload in local filesystem storage.
 * Replaces Supabase Storage for local SQLite-based deployment.
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

  // Ensure directory exists
  const dirPath = join(UPLOAD_ROOT, bucket, year, month)
  await mkdir(dirPath, { recursive: true })

  // Write file to disk
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
 */
export async function getSignedUrl(bucket: UploadBucket, storagePath: string, _expiresIn = 3600) {
  // In local storage, we just return the API URL — no signed URLs needed
  return `/api/v1/upload/${bucket}/${storagePath}`
}

/**
 * Download a stored file from local filesystem.
 */
export async function readStoredUpload(bucket: UploadBucket, storagePath: string) {
  const fullPath = join(UPLOAD_ROOT, bucket, storagePath)
  const buffer = await readFile(fullPath)
  const fileName = storagePath.split('/').pop() || 'file'

  return {
    bucket,
    storagePath,
    buffer,
    fileName,
    mimeType: inferMimeType(fileName),
  }
}

/**
 * Delete a stored file from local filesystem.
 */
export async function deleteStoredUpload(bucket: UploadBucket, storagePath: string) {
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
