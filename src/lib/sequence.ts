import { Prisma } from '@prisma/client'

type CreateWithGeneratedValueOptions<TValue, TResult> = {
  generateValue: () => Promise<TValue>
  create: (value: TValue) => Promise<TResult>
  uniqueFields?: string[]
  maxAttempts?: number
}

function isUniqueConstraintError(error: unknown, uniqueFields?: string[]) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  if (!uniqueFields || uniqueFields.length === 0) {
    return true
  }

  const rawTarget = error.meta?.target
  const target = Array.isArray(rawTarget)
    ? rawTarget.map(String)
    : typeof rawTarget === 'string'
      ? [rawTarget]
      : []

  return uniqueFields.some((field) => target.includes(field))
}

export async function createWithGeneratedUniqueValue<TValue, TResult>({
  generateValue,
  create,
  uniqueFields,
  maxAttempts = 5,
}: CreateWithGeneratedValueOptions<TValue, TResult>): Promise<TResult> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const value = await generateValue()

    try {
      return await create(value)
    } catch (error) {
      if (!isUniqueConstraintError(error, uniqueFields)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error('Gagal menjana nombor unik selepas beberapa percubaan')
}

