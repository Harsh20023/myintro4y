import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  passwordHash?: string       // optional — OAuth users have no password
  googleId?: string
  displayName?: string
  avatarUrl?: string
  role: 'user' | 'superadmin'
  isVerified: boolean
  otp?: string
  otpExpiry?: Date
  has_hrms_account: boolean
  hrms_user_id?: string
}

const UserSchema = new Schema<IUser>(
  {
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:     { type: String },                 // not required — OAuth users skip this
    googleId:         { type: String, sparse: true },   // sparse index allows multiple nulls
    displayName:      { type: String },
    avatarUrl:        { type: String },
    role:             { type: String, enum: ['user', 'superadmin'], default: 'user' },
    isVerified:       { type: Boolean, default: false },
    otp:              { type: String },
    otpExpiry:        { type: Date },
    has_hrms_account: { type: Boolean, default: false },
    hrms_user_id:     { type: String },
  },
  { timestamps: true }
)

export const User = model<IUser>('User', UserSchema)
