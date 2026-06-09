import { Response, NextFunction } from 'express'
import { AuthRequest } from './authenticate'

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' })
  }
  next()
}
