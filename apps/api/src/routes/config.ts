import { Router } from 'express'
import { ConfigController } from '../controllers/config.controller'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'

const router = Router()

router.get  ('/tools-access', ConfigController.getToolsAccess)
router.patch('/tools-access', authenticate, requireSuperAdmin, ConfigController.setToolsAccess)

export default router
