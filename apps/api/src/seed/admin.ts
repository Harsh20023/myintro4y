import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db'
import { User } from '../models/User'
import { SystemConfig } from '../models/SystemConfig'

async function seed() {
  await connectDB()

  const email    = process.env.SUPERADMIN_EMAIL    ?? 'admin@ledgerhq.com'
  const password = process.env.SUPERADMIN_PASSWORD ?? 'Admin@1234'

  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`Superadmin ${email} already exists — skipping.`)
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await User.create({ email, passwordHash, role: 'superadmin', isVerified: true })
    console.log(`Superadmin created: ${email}`)
  }

  // Ensure default config exists
  await SystemConfig.findOneAndUpdate(
    { key: 'tools_require_login' },
    { key: 'tools_require_login', value: false },
    { upsert: true }
  )
  console.log('SystemConfig seeded.')

  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
