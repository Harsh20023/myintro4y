import { Schema, model, Document } from 'mongoose'

export interface ITaxMetaYear extends Document {
  tax_year: string
  rebate_87a: {
    new_regime: {
      max_rebate_amount: number
      income_threshold: number
      rebate_type: string
      description: string
      eligible: string[]
      not_eligible: string[]
    }
    old_regime: {
      max_rebate_amount: number
      income_threshold: number
      rebate_type: string
      description: string
      eligible: string[]
      not_eligible: string[]
    }
  }
  mat_amt: {
    mat: {
      section: string
      description: string
      rate_pct: number
      base: string
      triggers_when: string
      applicable_to: string[]
      exempt: string[]
      special_cases: { entity: string; rate_pct: number }[]
      surcharge_cess: string
      form: string
    }
    amt: {
      section: string
      description: string
      rate_pct: number
      base: string
      triggers_when: string
      applicable_to: string[]
      surcharge_cess: string
      form: string
      note: string
    }
  }
  standard_deduction: {
    salaried_new_regime: { section: string; amount: number; regime: string; description: string }
    salaried_old_regime: { section: string; amount: number; regime: string; description: string }
    family_pension:      { section: string; max_amount: number; regime: string; description: string; rate_fraction: string }
  }
}

const TaxMetaYearSchema = new Schema<ITaxMetaYear>(
  {
    tax_year:           { type: String, required: true, unique: true },
    rebate_87a:         { type: Schema.Types.Mixed, required: true },
    mat_amt:            { type: Schema.Types.Mixed, required: true },
    standard_deduction: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

export const TaxMetaYear = model<ITaxMetaYear>('TaxMetaYear', TaxMetaYearSchema)
