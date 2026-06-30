import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email?: string }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as { id: string; role: string }
    const user = await User.findById(decoded.id).select('_id role isVerified email')
    if (!user || !user.isVerified) {
      return res.status(401).json({ message: 'Invalid or unverified user' })
    }
    req.user = { id: user._id.toString(), role: user.role, email: (user as any).email ?? '' }
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' })
  }
}
