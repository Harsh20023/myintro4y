import { Router } from 'express'
import {
  SurchargeController,
  MetaYearController,
  DeductionController,
  ReferenceController,
} from '../controllers/taxMeta.controller'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'

const router = Router()
const guard = [authenticate, requireSuperAdmin]

// ── /tax-meta/surcharge ────────────────────────────────────────────────────────
// GET ?tax_year=2026-27&entity_class=individual_huf_aop_boi
router.get   ('/surcharge',                          SurchargeController.list)
router.get   ('/surcharge/:tax_year/:entity_class',  SurchargeController.getOne)
router.post  ('/surcharge',         ...guard,        SurchargeController.create)
router.put   ('/surcharge/:tax_year/:entity_class', ...guard, SurchargeController.update)
router.delete('/surcharge/:tax_year/:entity_class', ...guard, SurchargeController.remove)

// ── /tax-meta/year ─────────────────────────────────────────────────────────────
router.get   ('/year',           MetaYearController.list)
router.get   ('/year/:tax_year', MetaYearController.getOne)
router.post  ('/year',           ...guard, MetaYearController.create)
router.put   ('/year/:tax_year', ...guard, MetaYearController.update)
router.delete('/year/:tax_year', ...guard, MetaYearController.remove)

// ── /tax-meta/deductions ──────────────────────────────────────────────────────
// GET ?tax_year=2026-27&regime=old
router.get   ('/deductions',                        DeductionController.list)
router.get   ('/deductions/:tax_year/:section',     DeductionController.getOne)
router.post  ('/deductions',         ...guard,      DeductionController.create)
router.put   ('/deductions/:tax_year/:section', ...guard, DeductionController.update)
router.delete('/deductions/:tax_year/:section', ...guard, DeductionController.remove)

// ── /tax-meta/reference ───────────────────────────────────────────────────────
// GET ?tax_year=2026-27&category=itr_forms
router.get   ('/reference',                         ReferenceController.list)
router.get   ('/reference/:tax_year/:category',     ReferenceController.getOne)
router.post  ('/reference',          ...guard,      ReferenceController.create)
router.put   ('/reference/:tax_year/:category', ...guard, ReferenceController.update)
router.delete('/reference/:tax_year/:category', ...guard, ReferenceController.remove)

export default router
