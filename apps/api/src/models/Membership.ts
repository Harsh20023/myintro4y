import { Schema, model, Document, Types } from 'mongoose'

export type MemberType = 'individual' | 'organization'
export type TargetType = 'organization' | 'professional'

export interface IMembership extends Document {
  memberId:   Types.ObjectId
  memberType: MemberType
  targetId:   Types.ObjectId
  targetType: TargetType
  assignedBy: Types.ObjectId
}

const MembershipSchema = new Schema<IMembership>(
  {
    memberId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberType: { type: String, enum: ['individual', 'organization'], required: true },
    targetId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['organization', 'professional'], required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Prevent duplicate assignments
MembershipSchema.index({ memberId: 1, targetId: 1 }, { unique: true })

export const Membership = model<IMembership>('Membership', MembershipSchema)
