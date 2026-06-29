import { Schema, model, Document } from 'mongoose'

export interface IServiceCategory extends Document {
  name: string
  slug: string
  icon?: string
  displayOrder: number
  isVisible: boolean
}

const ServiceCategorySchema = new Schema<IServiceCategory>(
  {
    name:         { type: String, required: true },
    slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon:         { type: String },
    displayOrder: { type: Number, default: 0 },
    isVisible:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const ServiceCategory = model<IServiceCategory>('ServiceCategory', ServiceCategorySchema)
