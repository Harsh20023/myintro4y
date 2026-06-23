import { Schema, model, Document } from 'mongoose'

export interface RateEntry {
  applies_to: 'resident' | 'non_resident' | 'listed_debenture' | 'foreign_company' | 'non_resident_individual' | 'default'
  rate_type: 'percentage' | 'slab' | 'rates_in_force' | 'nil'
  value?: number
  basis?: 'gross' | 'income_comprised' | 'value_of_benefit' | 'net_winnings' | 'consideration'
  slab_ref?: string
  schedule_ref?: string
}

export interface ThresholdEntry {
  amount: number | null
  period: 'per_transaction' | 'per_month' | 'per_payment' | 'aggregate_annual' | 'none'
}

export interface ITdsCodeYear extends Document {
  code: string
  tax_year: string
  form: string
  source_note: string
  effective_from: Date
  effective_to: Date | null
  display_rate: string
  display_threshold: string
  rates_json: RateEntry[]
  thresholds_json: ThresholdEntry[]
}

const TdsCodeYearSchema = new Schema<ITdsCodeYear>(
  {
    code:              { type: String, required: true, ref: 'TdsCode' },
    tax_year:          { type: String, required: true },
    form:              { type: String, default: '' },
    source_note:       { type: String, default: '' },
    effective_from:    { type: Date, required: true },
    effective_to:      { type: Date, default: null },
    display_rate:      { type: String, default: '' },
    display_threshold: { type: String, default: '' },
    rates_json:        { type: Schema.Types.Mixed, required: true },
    thresholds_json:   { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

TdsCodeYearSchema.index({ code: 1, tax_year: 1 }, { unique: true })

export const TdsCodeYear = model<ITdsCodeYear>('TdsCodeYear', TdsCodeYearSchema)
