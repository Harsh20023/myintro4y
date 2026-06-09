import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.post('/register',   AuthController.register)
router.post('/verify-otp', AuthController.verifyOtp)
router.post('/login',      AuthController.login)
router.get('/me',          authenticate, AuthController.me as any)

export default router
