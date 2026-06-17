import { Router } from 'express'
import { GSTReturnsController } from '../controllers/gst-returns.controller'

const router = Router()

router.post('/captcha',  GSTReturnsController.getCaptcha)
router.post('/login',    GSTReturnsController.login)
router.post('/download', GSTReturnsController.downloadGSTR1)
router.post('/check',    GSTReturnsController.checkDownload)
router.post('/logout',   GSTReturnsController.logout)

export default router
