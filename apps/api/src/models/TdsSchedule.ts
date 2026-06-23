import { Schema, model, Document } from 'mongoose'

export interface BracketEntry {
  from: number
  to: number | null
  rate: number
}

export interface ITdsSchedule extends Document {
  ref: string
  kind: 'slab' | 'rates_in_force'
  regime: 'new' | 'old' | null
  tax_year: string
  legal_ref: string
  brackets_json: BracketEntry[]
  rebate_note: string
  surcharge_note: string
}

const TdsScheduleSchema = new Schema<ITdsSchedule>(
  {
    ref:            { type: String, required: true, unique: true, trim: true },
    kind:           { type: String, required: true, enum: ['slab', 'rates_in_force'] },
    regime:         { type: String, enum: ['new', 'old', null], default: null },
    tax_year:       { type: String, required: true },
    legal_ref:      { type: String, default: '' },
    brackets_json:  { type: Schema.Types.Mixed, required: true },
    rebate_note:    { type: String, default: '' },
    surcharge_note: { type: String, default: '' },
  },
  { timestamps: true }
)

export const TdsSchedule = model<ITdsSchedule>('TdsSchedule', TdsScheduleSchema)
