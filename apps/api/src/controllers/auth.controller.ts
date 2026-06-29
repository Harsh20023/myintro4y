import { Request, Response } from 'express'
import { AuthService, RegisterPayload } from '../services/auth.service'
import { AuthRequest } from '../middleware/authenticate'

const VALID_ACCOUNT_TYPES = ['individual', 'professional', 'organization'] as const

function handleError(res: Response, err: unknown) {
  const e      = err as Error & { status?: number }
  const status = e.status ?? 500
  return res.status(status).json({ message: e.message ?? 'Server error' })
}

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const body = req.body as Partial<RegisterPayload>
      const { email, password, accountType } = body

      if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
      if (!accountType || !(VALID_ACCOUNT_TYPES as readonly string[]).includes(accountType)) {
        return res.status(400).json({ message: 'accountType must be individual, professional, or organization' })
      }

      const result = await AuthService.register(body as RegisterPayload)
      return res.status(201).json({
        message: 'Registration successful. Use OTP 123456 to verify.',
        ...result,
      })
    } catch (err) { return handleError(res, err) }
  },

  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body as { email: string; otp: string }
      if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' })

      const result = await AuthService.verifyOtp(email, otp)
      return res.json({ message: 'Verified successfully', ...result })
    } catch (err) { return handleError(res, err) }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as { email: string; password: string }
      if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

      const result = await AuthService.login(email, password)
      return res.json(result)
    } catch (err) { return handleError(res, err) }
  },

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await AuthService.getMe(req.user!.id)
      return res.json({ user })
    } catch (err) { return handleError(res, err) }
  },
}
