import { Schema, model, Document } from 'mongoose'

export interface IHsnTaxDetail {
  rateOfTax: number
  effectiveDate: Date
  description: string
}

export interface IHsnCode extends Document {
  hsnCode: string
  type: 'HSN' | 'SAC'
  description: string
  chapterNumber: string
  parentCode: string | null
  currentRate: number | null
  currentRateEffectiveDate: Date | null
  taxDetails: IHsnTaxDetail[]
  active: boolean
  deletedAt: Date | null
  sourceId: string | null
  lastSyncedAt: Date | null
}

const TaxDetailSchema = new Schema<IHsnTaxDetail>(
  {
    rateOfTax:     { type: Number, required: true },
    effectiveDate: { type: Date,   required: true },
    description:   { type: String, required: true, trim: true },
  },
  { _id: false }
)

const HsnCodeSchema = new Schema<IHsnCode>(
  {
    hsnCode:                  { type: String,  required: true, unique: true, trim: true },
    type:                     { type: String,  required: true, enum: ['HSN', 'SAC'] },
    description:              { type: String,  required: true, trim: true },
    chapterNumber:            { type: String,  required: true, index: true },
    parentCode:               { type: String,  default: null, sparse: true },
    currentRate:              { type: Number,  default: null },
    currentRateEffectiveDate: { type: Date,    default: null },
    taxDetails:               { type: [TaxDetailSchema], default: [] },
    active:                   { type: Boolean, default: true, index: true },
    deletedAt:                { type: Date,    default: null },
    sourceId:                 { type: String,  default: null },
    lastSyncedAt:             { type: Date,    default: null },
  },
  { timestamps: true }
)

HsnCodeSchema.index({ type: 1, chapterNumber: 1 })
HsnCodeSchema.index({ parentCode: 1 })

export const HsnCode = model<IHsnCode>('HsnCode', HsnCodeSchema)
