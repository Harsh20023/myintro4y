import { Schema, model, Document } from 'mongoose'

export interface ITdsCode extends Document {
  code: string
  tax_type: 'TDS' | 'TCS'
  description: string
  deductor: string
  payee_type: string
  old_section: string
  new_section: string
}

const TdsCodeSchema = new Schema<ITdsCode>(
  {
    code:        { type: String, required: true, unique: true, trim: true },
    tax_type:    { type: String, required: true, enum: ['TDS', 'TCS'] },
    description: { type: String, required: true },
    deductor:    { type: String, required: true },
    payee_type:  { type: String, required: true },
    old_section: { type: String, required: true },
    new_section: { type: String, required: true },
  },
  { timestamps: true }
)

export const TdsCode = model<ITdsCode>('TdsCode', TdsCodeSchema)
