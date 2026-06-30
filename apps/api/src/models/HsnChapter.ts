import { Schema, model, Document } from 'mongoose'

export interface IHsnChapter extends Document {
  chapterNumber: string
  chapterName: string
  type: 'HSN' | 'SAC'
  slug: string
  description: string
  active: boolean
}

const HsnChapterSchema = new Schema<IHsnChapter>(
  {
    chapterNumber: { type: String,  required: true, unique: true, trim: true },
    chapterName:   { type: String,  required: true, trim: true },
    type:          { type: String,  required: true, enum: ['HSN', 'SAC'] },
    slug:          { type: String,  required: true, unique: true, trim: true },
    description:   { type: String,  default: '', trim: true },
    active:        { type: Boolean, default: true },
  },
  { timestamps: true }
)

HsnChapterSchema.index({ type: 1 })

export const HsnChapter = model<IHsnChapter>('HsnChapter', HsnChapterSchema)
