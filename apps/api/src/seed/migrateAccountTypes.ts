import 'dotenv/config'
import { connectDB } from '../config/db'
import { User } from '../models/User'

async function migrate() {
  await connectDB()

  // Patch all documents that have no accountType field stored in MongoDB.
  // Mongoose defaults don't backfill existing documents — this does.
  const result = await User.updateMany(
    { accountType: { $exists: false } },
    { $set: { accountType: 'individual' } }
  )

  console.log(`✓ Patched ${result.modifiedCount} user(s) → accountType: "individual"`)

  // Verify
  const missing = await User.countDocuments({ accountType: { $exists: false } })
  if (missing > 0) {
    console.warn(`⚠ ${missing} document(s) still missing accountType`)
  } else {
    console.log('✓ All users now have accountType set')
  }

  const breakdown = await User.aggregate([
    { $group: { _id: '$accountType', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])
  console.log('\nBreakdown:')
  breakdown.forEach(b => console.log(`  ${b._id ?? '(null)'}: ${b.count}`))

  process.exit(0)
}

migrate().catch(err => { console.error(err); process.exit(1) })
