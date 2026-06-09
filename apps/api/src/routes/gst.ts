import { Router } from 'express'
import { GSTController } from '../controllers/gst.controller'

const router = Router()

// POST so GSTIN is in body, not exposed in URL logs
router.post('/captcha', GSTController.getCaptcha)
router.post('/verify',  GSTController.verify)

export default router
