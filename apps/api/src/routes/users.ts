import { Router, Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'
import { User } from '../models/User'

const router = Router()
const guard  = [authenticate, requireSuperAdmin as any]

// ── List users ────────────────────────────────────────────────────────────────
router.get('/', ...guard, async (req: AuthRequest, res: Response) => {
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
      filter.$or = [{ email: re }, { displayName: re }, { orgName: re }, { firmName: re }]
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
    res.status(500).json({ message: (err as Error).message })
  }
})

// ── Create user (admin) ───────────────────────────────────────────────────────
router.post('/', ...guard, async (req: AuthRequest, res: Response) => {
  try {
    const {
      email, accountType,
      displayName, firmName, membershipNumber,
      orgName, pan, gstin, phone,
    } = req.body as Record<string, string>

    if (!email)       return res.status(400).json({ message: 'Email is required' })
    if (!accountType) return res.status(400).json({ message: 'accountType is required' })
    if (!['individual', 'professional', 'organization'].includes(accountType)) {
      return res.status(400).json({ message: 'Invalid accountType' })
    }
    if (accountType === 'organization' && !orgName) {
      return res.status(400).json({ message: 'orgName is required for organization accounts' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    // generate a temporary password the admin can share with the user
    const tempPassword = crypto.randomBytes(5).toString('hex').toUpperCase() + '@1'
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      accountType,
      displayName:      displayName      || undefined,
      firmName:         firmName         || undefined,
      membershipNumber: membershipNumber || undefined,
      orgName:          orgName          || undefined,
      pan:              pan              ? pan.toUpperCase()   : undefined,
      gstin:            gstin            ? gstin.toUpperCase() : undefined,
      phone:            phone            || undefined,
      isVerified: true,  // admin-created accounts are auto-verified
      role: 'user',
    })

    const safe = user.toObject() as unknown as Record<string, unknown>
    delete safe.passwordHash
    delete safe.otp
    delete safe.otpExpiry

    res.status(201).json({ user: safe, tempPassword })
  } catch (err) {
    res.status(500).json({ message: (err as Error).message })
  }
})

export default router
