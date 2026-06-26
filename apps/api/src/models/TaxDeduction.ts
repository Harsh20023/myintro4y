import { Schema, model, Document } from 'mongoose'

export interface ITaxDeduction extends Document {
  tax_year: string
  section: string
  name: string
  regime: 'new' | 'old' | 'both'
  applicable_to: string[]
  data: unknown  // flexible — each deduction has very different shape
}

const TaxDeductionSchema = new Schema<ITaxDeduction>(
  {
    tax_year:      { type: String, required: true },
    section:       { type: String, required: true },
    name:          { type: String, required: true },
    regime:        { type: String, required: true, enum: ['new', 'old', 'both'] },
    applicable_to: { type: [String], default: [] },
    data:          { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

TaxDeductionSchema.index({ tax_year: 1, section: 1 }, { unique: true })

export const TaxDeduction = model<ITaxDeduction>('TaxDeduction', TaxDeductionSchema)
