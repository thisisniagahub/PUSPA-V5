import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto'

function scrypt(password: string, salt: string, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }
      resolve(derivedKey)
    })
  })
}
const KEY_LENGTH = 64
const HASH_PREFIX = 'scrypt'
// scrypt cost parameters: N=16384, r=8, p=2 (memory-hard, secure)
const SCRYPT_N = 1 << 14 // 16384
const SCRYPT_R = 8
const SCRYPT_P = 2

export function isPasswordHash(value: string): boolean {
  return value.startsWith(`${HASH_PREFIX}$`)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer

  return `${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!isPasswordHash(hash)) {
    return false
  }

  const [, salt, storedHash] = hash.split('$')

  if (!salt || !storedHash) {
    return false
  }

  const expected = Buffer.from(storedHash, 'hex')
  const actual = (await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}
