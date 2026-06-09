import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3000'

export const GoogleController = {
  callback(req: Request, res: Response) {
    const user = req.user!
    const token = AuthService.signToken(user.id, user.role)
    res.redirect(`${FRONTEND}/auth/callback?token=${token}`)
  },
}
