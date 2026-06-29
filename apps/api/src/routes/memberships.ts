import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'
import { Membership } from '../models/Membership'
import { User } from '../models/User'

const router = Router()
const guard  = [authenticate, requireSuperAdmin as any]

// ── List memberships ──────────────────────────────────────────────────────────
router.get('/', ...guard, async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, targetId } = req.query as Record<string, string>
    const filter: Record<string, unknown> = {}
    if (memberId) filter.memberId = memberId
    if (targetId) filter.targetId = targetId

    const memberships = await Membership.find(filter)
      .populate('memberId', 'email displayName orgName firmName accountType')
      .populate('targetId', 'email displayName orgName firmName accountType')
      .sort({ createdAt: -1 })
      .lean()

    res.json(memberships)
  } catch (err) {
    res.status(500).json({ message: (err as Error).message })
  }
})

// ── Create assignment ─────────────────────────────────────────────────────────
router.post('/', ...guard, async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, targetId } = req.body as { memberId: string; targetId: string }
    if (!memberId || !targetId) {
      return res.status(400).json({ message: 'memberId and targetId are required' })
    }
    if (memberId === targetId) {
      return res.status(400).json({ message: 'Cannot assign a user to themselves' })
    }

    const [member, target] = await Promise.all([
      User.findById(memberId).select('accountType').lean(),
      User.findById(targetId).select('accountType').lean(),
    ])
    if (!member) return res.status(404).json({ message: 'Member user not found' })
    if (!target) return res.status(404).json({ message: 'Target user not found' })

    // Validate allowed assignment combinations
    const mType = member.accountType
    const tType = target.accountType

    const allowed =
      (mType === 'individual'   && (tType === 'organization' || tType === 'professional')) ||
      (mType === 'organization' && tType === 'professional')

    if (!allowed) {
      return res.status(400).json({
        message: `Cannot assign ${mType} to ${tType}. Allowed: individual→org, individual→professional, org→professional`,
      })
    }

    const membership = await Membership.create({
      memberId,
      memberType: mType as 'individual' | 'organization',
      targetId,
      targetType: tType as 'organization' | 'professional',
      assignedBy: req.user!.id,
    })

    const populated = await membership.populate([
      { path: 'memberId', select: 'email displayName orgName firmName accountType' },
      { path: 'targetId', select: 'email displayName orgName firmName accountType' },
    ])

    res.status(201).json(populated)
  } catch (err: unknown) {
    const e = err as Error & { code?: number }
    if (e.code === 11000) {
      return res.status(409).json({ message: 'This assignment already exists' })
    }
    res.status(500).json({ message: e.message })
  }
})

// ── Delete assignment ─────────────────────────────────────────────────────────
router.delete('/:id', ...guard, async (_req: AuthRequest, res: Response) => {
  try {
    const { id } = _req.params
    const deleted = await Membership.findByIdAndDelete(id)
    if (!deleted) return res.status(404).json({ message: 'Assignment not found' })
    res.json({ message: 'Assignment removed', id })
  } catch (err) {
    res.status(500).json({ message: (err as Error).message })
  }
})

export default router
