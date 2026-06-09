import { Schema, model, Document } from 'mongoose'

export interface ISystemConfig extends Document {
  key: string
  value: boolean | string | number
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    key:   { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

export const SystemConfig = model<ISystemConfig>('SystemConfig', SystemConfigSchema)
