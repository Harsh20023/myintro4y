import { Schema, model, Document } from 'mongoose'

export type AccountType = 'individual' | 'professional' | 'organization'

export interface IUser extends Document {
  email: string
  passwordHash?: string
  googleId?: string
  displayName?: string
  avatarUrl?: string
  role: 'user' | 'superadmin'
  accountType: AccountType
  // professional fields
  firmName?: string
  membershipNumber?: string
  // organization fields
  orgName?: string
  pan?: string
  gstin?: string
  // shared
  phone?: string
  isVerified: boolean
  otp?: string
  otpExpiry?: Date
  has_hrms_account: boolean
  hrms_user_id?: string
}

const UserSchema = new Schema<IUser>(
  {
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:     { type: String },
    googleId:         { type: String, sparse: true },
    displayName:      { type: String },
    avatarUrl:        { type: String },
    role:             { type: String, enum: ['user', 'superadmin'], default: 'user' },
    accountType:      { type: String, enum: ['individual', 'professional', 'organization'], default: 'individual' },
    firmName:         { type: String },
    membershipNumber: { type: String },
    orgName:          { type: String },
    pan:              { type: String, uppercase: true, trim: true },
    gstin:            { type: String, uppercase: true, trim: true },
    phone:            { type: String },
    isVerified:       { type: Boolean, default: false },
    otp:              { type: String },
    otpExpiry:        { type: Date },
    has_hrms_account: { type: Boolean, default: false },
    hrms_user_id:     { type: String },
  },
  { timestamps: true }
)

export const User = model<IUser>('User', UserSchema)
