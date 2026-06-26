import { Schema, model, Document } from 'mongoose'

export type TaxReferenceCategory =
  | 'itr_forms'
  | 'regime_switching'
  | 'special_provisions'
  | 'compliance_forms'

export interface ITaxReference extends Document {
  tax_year: string
  category: TaxReferenceCategory
  data: unknown
}

const TaxReferenceSchema = new Schema<ITaxReference>(
  {
    tax_year: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['itr_forms', 'regime_switching', 'special_provisions', 'compliance_forms'],
    },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

TaxReferenceSchema.index({ tax_year: 1, category: 1 }, { unique: true })

export const TaxReference = model<ITaxReference>('TaxReference', TaxReferenceSchema)
