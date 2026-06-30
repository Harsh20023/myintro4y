import { Schema, model, Document } from 'mongoose'

export type HsnAction = 'created' | 'updated' | 'deleted' | 'restored'

export interface IHsnDiff {
  field: string
  from: unknown
  to:   unknown
}

export interface IHsnHistory extends Document {
  hsnCode:   string
  action:    HsnAction
  changedBy: string       // admin email
  changedAt: Date
  snapshot:  Record<string, unknown>   // full document state after the change
  diff:      IHsnDiff[]               // what changed (empty for 'created')
}

const DiffSchema = new Schema<IHsnDiff>(
  { field: String, from: Schema.Types.Mixed, to: Schema.Types.Mixed },
  { _id: false }
)

const HsnHistorySchema = new Schema<IHsnHistory>(
  {
    hsnCode:   { type: String, required: true, index: true },
    action:    { type: String, required: true, enum: ['created', 'updated', 'deleted', 'restored'] },
    changedBy: { type: String, required: true },
    changedAt: { type: Date,   required: true, default: () => new Date() },
    snapshot:  { type: Schema.Types.Mixed, required: true },
    diff:      { type: [DiffSchema], default: [] },
  },
  { timestamps: false }
)

HsnHistorySchema.index({ hsnCode: 1, changedAt: -1 })

export const HsnHistory = model<IHsnHistory>('HsnHistory', HsnHistorySchema)
