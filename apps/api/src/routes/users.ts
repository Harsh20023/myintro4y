import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'
import { User } from '../models/User'

const router = Router()

router.get('/', authenticate, requireSuperAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string ?? '50', 10)))
    const accountType = req.query.accountType as string | undefined
    const search      = (req.query.search as string ?? '').trim()

    const filter: Record<string, unknown> = {}
    if (accountType && ['individual', 'professional', 'organization'].includes(accountType)) {
      filter.accountType = accountType
    }
    if (search) {
      const re = new RegExp(search, 'i')
      filter.$or = [
        { email: re },
        { displayName: re },
        { orgName: re },
        { firmName: re },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -otp -otpExpiry -googleId -hrms_user_id')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ])

    res.json({ users, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (err) {
    const e = err as Error
    res.status(500).json({ message: e.message ?? 'Server error' })
  }
})

export default router
