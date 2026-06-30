import { Router } from 'express'
import { HsnController, ChaptersController } from '../controllers/hsn.controller'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'

const router = Router()
const guard = [authenticate, requireSuperAdmin]

// ── /hsn/chapters ─────────────────────────────────────────────────────────────
// GET ?type=HSN|SAC
router.get   ('/chapters',          ChaptersController.list)
router.get   ('/chapters/:number',  ChaptersController.getOne)
router.post  ('/chapters',          ...guard, ChaptersController.create)
router.put   ('/chapters/:number',  ...guard, ChaptersController.update)
router.delete('/chapters/:number',  ...guard, ChaptersController.remove)

// ── /hsn ──────────────────────────────────────────────────────────────────────
// GET ?type=HSN|SAC&chapter=01&rate=18&q=animal&active=true&page=1&limit=200
router.get   ('/',                  HsnController.list)
router.get   ('/:code/children',    HsnController.getChildren)
router.get   ('/:code',             HsnController.getOne)
router.post  ('/',                  ...guard, HsnController.create)
router.put   ('/:code',             ...guard, HsnController.update)
router.delete('/:code',             ...guard, HsnController.softRemove)
router.post  ('/:code/restore',     ...guard, HsnController.restore)

export default router
