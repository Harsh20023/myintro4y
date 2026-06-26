import { Schema, model, Document } from 'mongoose'

export interface SurchargeBracket {
  income_exceeds: number
  income_upto: number | null
  surcharge_pct: number
}

export interface ITaxSurcharge extends Document {
  tax_year: string
  entity_class: string
  description: string
  // For individual/HUF/AOP/BOI the two regimes differ; for all others brackets_json is { brackets: [...] }
  brackets_json: {
    new_regime?: SurchargeBracket[]
    old_regime?: SurchargeBracket[]
    brackets?: SurchargeBracket[]
  }
  marginal_relief_thresholds: number[]
  special_notes: string[]
}

const TaxSurchargeSchema = new Schema<ITaxSurcharge>(
  {
    tax_year:                    { type: String, required: true },
    entity_class:                { type: String, required: true },
    description:                 { type: String, default: '' },
    brackets_json:               { type: Schema.Types.Mixed, required: true },
    marginal_relief_thresholds:  { type: [Number], default: [] },
    special_notes:               { type: [String], default: [] },
  },
  { timestamps: true }
)

TaxSurchargeSchema.index({ tax_year: 1, entity_class: 1 }, { unique: true })

export const TaxSurcharge = model<ITaxSurcharge>('TaxSurcharge', TaxSurchargeSchema)
