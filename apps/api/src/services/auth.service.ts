import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { User } from '../models/User'

const STATIC_OTP = '123456'

function signToken(id: string, role: string): string {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions
  )
}

export const AuthService = {
  async register(email: string, password: string) {
    const existing = await User.findOne({ email })
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 })

    const passwordHash = await bcrypt.hash(password, 10)
    const otpExpiry    = new Date(Date.now() + 10 * 60 * 1000)

    const user = await User.create({ email, passwordHash, otp: STATIC_OTP, otpExpiry })
    return { userId: user._id }
  },

  async verifyOtp(email: string, otp: string) {
    const user = await User.findOne({ email })
    if (!user)           throw Object.assign(new Error('User not found'),       { status: 404 })
    if (user.isVerified) throw Object.assign(new Error('Already verified'),     { status: 400 })
    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 })
    }

    user.isVerified = true
    user.otp        = undefined
    user.otpExpiry  = undefined
    await user.save()

    return { token: signToken(user._id.toString(), user.role) }
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email })
    if (!user)              throw Object.assign(new Error('Invalid credentials'),                { status: 401 })
    if (!user.isVerified)   throw Object.assign(new Error('Email not verified'),                 { status: 401 })
    if (!user.passwordHash) throw Object.assign(new Error('This account uses Google sign-in'), { status: 401 })

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) throw Object.assign(new Error('Invalid credentials'), { status: 401 })

    return {
      token: signToken(user._id.toString(), user.role),
      user: {
        id:               user._id,
        email:            user.email,
        role:             user.role,
        has_hrms_account: user.has_hrms_account,
      },
    }
  },

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash -otp -otpExpiry')
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 })
    return user
  },

  signToken,
}
