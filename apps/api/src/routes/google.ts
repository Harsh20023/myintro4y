import { Router } from 'express'
import passport from 'passport'
import { GoogleController } from '../controllers/google.controller'

const router  = Router()
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3000'

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND}/login?error=oauth_failed`,
  }),
  GoogleController.callback
)

export default router
