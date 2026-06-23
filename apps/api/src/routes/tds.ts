import { Router } from 'express'
import { CodesController, CodeYearsController, SchedulesController } from '../controllers/tds.controller'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'

const router = Router()
const guard = [authenticate, requireSuperAdmin]

// ── /tds/codes ────────────────────────────────────────────────────────────────
router.get   ('/codes',       CodesController.list)
router.get   ('/codes/:code', CodesController.getOne)
router.post  ('/codes',       ...guard, CodesController.create)
router.put   ('/codes/:code', ...guard, CodesController.update)
router.delete('/codes/:code', ...guard, CodesController.remove)

// ── /tds/code-years ───────────────────────────────────────────────────────────
// GET ?code=1004&tax_year=2026-27
router.get   ('/code-years',     CodeYearsController.list)
router.get   ('/code-years/:id', CodeYearsController.getOne)
router.post  ('/code-years',     ...guard, CodeYearsController.create)
router.put   ('/code-years/:id', ...guard, CodeYearsController.update)
router.delete('/code-years/:id', ...guard, CodeYearsController.remove)

// ── /tds/schedules ────────────────────────────────────────────────────────────
// GET ?kind=slab&tax_year=2026-27&regime=new
router.get   ('/schedules',      SchedulesController.list)
router.get   ('/schedules/:ref', SchedulesController.getOne)
router.post  ('/schedules',      ...guard, SchedulesController.create)
router.put   ('/schedules/:ref', ...guard, SchedulesController.update)
router.delete('/schedules/:ref', ...guard, SchedulesController.remove)

export default router
