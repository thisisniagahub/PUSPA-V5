import { PrismaClient } from '@prisma/client'
import { scrypt, randomBytes } from 'node:crypto'

const db = new PrismaClient()

const KEY_LENGTH = 64
const SCRYPT_N = 1 << 14
const SCRYPT_R = 8
const SCRYPT_P = 2

function scryptAsync(password: string, salt: string, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) => {
      if (err) reject(err)
      else resolve(key as Buffer)
    })
  })
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt$${salt}$${derivedKey.toString('hex')}`
}

const ACCOUNTS: { name: string; email: string; password: string; role: 'staff' | 'admin' | 'developer'; phone: string }[] = [
  {
    name: 'Kakitangan PUSPA',
    email: 'staff@puspa.org.my',
    password: 'Staff@2026',
    role: 'staff',
    phone: '03-4107 8801',
  },
  {
    name: 'Pentadbir PUSPA',
    email: 'admin@puspa.org.my',
    password: 'Admin@2026',
    role: 'admin',
    phone: '03-4107 8899',
  },
  {
    name: 'Pembangun PUSPA',
    email: 'dev@puspa.org.my',
    password: 'Dev@2026',
    role: 'developer',
    phone: '03-4107 8900',
  },
]

async function main() {
  console.log('🔧 Seeding user accounts...\n')

  for (const account of ACCOUNTS) {
    const existing = await db.user.findUnique({ where: { email: account.email } })

    if (existing) {
      const hashedPassword = await hashPassword(account.password)
      await db.user.update({
        where: { email: account.email },
        data: {
          name: account.name,
          password: hashedPassword,
          role: account.role,
          phone: account.phone,
          isActive: true,
        },
      })
      console.log(`✅ Updated: ${account.email} [${account.role}]`)
    } else {
      const hashedPassword = await hashPassword(account.password)
      await db.user.create({
        data: {
          name: account.name,
          email: account.email,
          password: hashedPassword,
          role: account.role,
          phone: account.phone,
          isActive: true,
        },
      })
      console.log(`✅ Created: ${account.email} [${account.role}]`)
    }
  }

  console.log('\n📋 All users:')
  const allUsers = await db.user.findMany({
    select: { email: true, name: true, role: true, isActive: true },
    orderBy: { role: 'asc' },
  })
  for (const u of allUsers) {
    console.log(`   ${u.role.padEnd(10)} | ${u.email.padEnd(25)} | ${u.name} | ${u.isActive ? '✅ Active' : '❌ Inactive'}`)
  }

  await db.$disconnect()
  console.log('\n🚀 Done!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
