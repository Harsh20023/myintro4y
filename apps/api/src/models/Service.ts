import { Schema, model, Document, Types } from 'mongoose'

export interface IService extends Document {
  categoryId: Types.ObjectId
  name: string
  slug: string
  shortDescription?: string
  icon?: string
  displayOrder: number
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
}

const ServiceSchema = new Schema<IService>(
  {
    categoryId:       { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
    name:             { type: String, required: true },
    slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String },
    icon:             { type: String },
    displayOrder:     { type: Number, default: 0 },
    isActive:         { type: Boolean, default: true },
    metaTitle:        { type: String },
    metaDescription:  { type: String },
  },
  { timestamps: true }
)

export const Service = model<IService>('Service', ServiceSchema)
