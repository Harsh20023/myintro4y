import { Schema, model, Document, Types } from 'mongoose'

export type SectionType =
  | 'STEPS'
  | 'BENEFITS'
  | 'DOCUMENTS_REQUIRED'
  | 'FAQ'
  | 'PRICING'
  | 'WHY_US'
  | 'COMPARISON_TABLE'
  | 'CUSTOM'

export type BlockType =
  | 'STEP'
  | 'LIST_ITEM'
  | 'FAQ_ITEM'
  | 'PRICING_CARD'
  | 'TABLE_ROW'
  | 'TEXT'

export interface IPageBlock {
  _id: Types.ObjectId
  type: BlockType
  title?: string
  body?: string
  icon?: string
  displayOrder: number
  metadata?: Record<string, unknown>
}

export interface IPageSection {
  _id: Types.ObjectId
  type: SectionType
  heading: string
  displayOrder: number
  isVisible: boolean
  blocks: IPageBlock[]
}

export interface IServicePage extends Document {
  serviceId: Types.ObjectId
  heroTitle?: string
  heroSubtitle?: string
  heroCTAText?: string
  overviewText?: string
  eligibilityText?: string
  sections: IPageSection[]
}

const PageBlockSchema = new Schema<IPageBlock>(
  {
    type:         { type: String, enum: ['STEP', 'LIST_ITEM', 'FAQ_ITEM', 'PRICING_CARD', 'TABLE_ROW', 'TEXT'], required: true },
    title:        { type: String },
    body:         { type: String },
    icon:         { type: String },
    displayOrder: { type: Number, default: 0 },
    metadata:     { type: Schema.Types.Mixed },
  },
  { _id: true }
)

const PageSectionSchema = new Schema<IPageSection>(
  {
    type:         { type: String, enum: ['STEPS', 'BENEFITS', 'DOCUMENTS_REQUIRED', 'FAQ', 'PRICING', 'WHY_US', 'COMPARISON_TABLE', 'CUSTOM'], required: true },
    heading:      { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isVisible:    { type: Boolean, default: true },
    blocks:       [PageBlockSchema],
  },
  { _id: true }
)

const ServicePageSchema = new Schema<IServicePage>(
  {
    serviceId:      { type: Schema.Types.ObjectId, ref: 'Service', required: true, unique: true },
    heroTitle:      { type: String },
    heroSubtitle:   { type: String },
    heroCTAText:    { type: String },
    overviewText:   { type: String },
    eligibilityText:{ type: String },
    sections:       [PageSectionSchema],
  },
  { timestamps: true }
)

export const ServicePage = model<IServicePage>('ServicePage', ServicePageSchema)
