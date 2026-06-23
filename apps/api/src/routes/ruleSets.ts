import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'
import { RuleSetsController, calculate } from '../controllers/ruleSets.controller'

const router = Router()
const guard  = [authenticate, requireSuperAdmin]

// ── Public reads ──────────────────────────────────────────────────────────────
router.get('/',    RuleSetsController.list)
router.get('/:id', RuleSetsController.getOne)

// ── Write operations (superadmin) ─────────────────────────────────────────────
router.post('/',    ...guard, RuleSetsController.create)
router.patch('/:id', ...guard, RuleSetsController.update)
router.delete('/:id', ...guard, RuleSetsController.softDelete)

// ── Sub-array: lateFeeRules ───────────────────────────────────────────────────
router.post('/:id/late-fee-rules',           ...guard, RuleSetsController.pushLateFeeRule)
router.delete('/:id/late-fee-rules/:ruleId', ...guard, RuleSetsController.pullLateFeeRule)

// ── Sub-array: interestRules ──────────────────────────────────────────────────
router.post('/:id/interest-rules',           ...guard, RuleSetsController.pushInterestRule)
router.delete('/:id/interest-rules/:ruleId', ...guard, RuleSetsController.pullInterestRule)

// ── Sub-array: waivers ────────────────────────────────────────────────────────
router.post('/:id/waivers',               ...guard, RuleSetsController.pushWaiver)
router.delete('/:id/waivers/:waiverId',   ...guard, RuleSetsController.pullWaiver)

export default router

// ── /api/calculate (separate export — mounted at root level in index.ts) ──────
export { calculate }
