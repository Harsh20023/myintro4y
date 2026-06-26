import { Schema, model, Document } from 'mongoose'

export interface ITaxConfigCache extends Document {
  tax_year:    string
  version:     string
  compiled_at: Date
  data:        Record<string, unknown>
}

const TaxConfigCacheSchema = new Schema<ITaxConfigCache>({
  tax_year:    { type: String, required: true, unique: true },
  version:     { type: String, required: true },
  compiled_at: { type: Date,   required: true },
  data:        { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })

export const TaxConfigCache = model<ITaxConfigCache>('TaxConfigCache', TaxConfigCacheSchema)
