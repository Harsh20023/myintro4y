import { Router } from 'express'
import { ServicesController } from '../controllers/services.controller'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'

const router = Router()
const admin = [authenticate, requireSuperAdmin] as const

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/categories',  ServicesController.getCategories)
router.get('/:slug',       ServicesController.getServiceBySlug)

// ── Category admin ───────────────────────────────────────────────────────────
router.post  ('/categories',             ...admin, ServicesController.createCategory)
router.patch ('/categories/:categoryId', ...admin, ServicesController.updateCategory)
router.delete('/categories/:categoryId', ...admin, ServicesController.deleteCategory)

// ── Service admin ────────────────────────────────────────────────────────────
router.post  ('/',            ...admin, ServicesController.createService)
router.patch ('/:serviceId',  ...admin, ServicesController.updateService)
router.delete('/:serviceId',  ...admin, ServicesController.deleteService)

// ── Page admin ───────────────────────────────────────────────────────────────
router.put   ('/:serviceId/page',                                          ...admin, ServicesController.upsertPage)
router.post  ('/:serviceId/page/sections',                                 ...admin, ServicesController.addSection)
router.patch ('/:serviceId/page/sections/:sectionId',                      ...admin, ServicesController.updateSection)
router.delete('/:serviceId/page/sections/:sectionId',                      ...admin, ServicesController.deleteSection)
router.post  ('/:serviceId/page/sections/:sectionId/blocks',               ...admin, ServicesController.addBlock)
router.patch ('/:serviceId/page/sections/:sectionId/blocks/:blockId',      ...admin, ServicesController.updateBlock)
router.delete('/:serviceId/page/sections/:sectionId/blocks/:blockId',      ...admin, ServicesController.deleteBlock)

export default router
