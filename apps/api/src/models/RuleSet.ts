import { Schema, model, Document } from 'mongoose'

// ── Sub-document interfaces ───────────────────────────────────────────────────

export interface TurnoverSlab {
  label: string
  lower: number
  upper: number | null   // null = "and above"
}

export interface LateFeeRule {
  _id?: unknown
  returnTypeCode: string
  returnTypeName: string
  frequency: 'monthly' | 'quarterly' | 'annual' | 'event'
  dueRuleType: 'dayOfFollowingMonth' | 'quarterly' | 'annual' | 'eventBased'
  dueParam: number | null  // day of month, or MMDD for annual (e.g. 1231)
  turnoverSlab: TurnoverSlab
  isNil: boolean
  perDayCgst: number
  perDaySgst: number
  capType: 'flat' | 'percentOfTurnover' | 'none'
  capValue: number | null
}

export interface InterestRule {
  _id?: unknown
  type: 'latePayment' | 'excessItc'
  annualRate: number   // 18 or 24
  dayBasis: number     // 365
}

export interface Waiver {
  _id?: unknown
  returnTypeCode: string
  periodFrom: Date
  periodTo: Date
  fileBy: Date
  overrideType: 'cap' | 'perDay' | 'full'
  overrideValue: number | null  // null for full waiver
}

export interface IRuleSet extends Document {
  effectiveFrom: Date
  effectiveTo: Date | null
  notification: {
    number: string
    title: string
    url: string
  }
  lateFeeRules: LateFeeRule[]
  interestRules: InterestRule[]
  waivers: Waiver[]
  deletedAt: Date | null
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const TurnoverSlabSchema = new Schema<TurnoverSlab>(
  { label: String, lower: Number, upper: { type: Number, default: null } },
  { _id: false }
)

const LateFeeRuleSchema = new Schema<LateFeeRule>({
  returnTypeCode: { type: String, required: true },
  returnTypeName: { type: String, required: true },
  frequency:      { type: String, required: true, enum: ['monthly', 'quarterly', 'annual', 'event'] },
  dueRuleType:    { type: String, required: true, enum: ['dayOfFollowingMonth', 'quarterly', 'annual', 'eventBased'] },
  dueParam:       { type: Number, default: null },
  turnoverSlab:   { type: TurnoverSlabSchema, required: true },
  isNil:          { type: Boolean, required: true },
  perDayCgst:     { type: Number, required: true },
  perDaySgst:     { type: Number, required: true },
  capType:        { type: String, required: true, enum: ['flat', 'percentOfTurnover', 'none'] },
  capValue:       { type: Number, default: null },
})

const InterestRuleSchema = new Schema<InterestRule>({
  type:       { type: String, required: true, enum: ['latePayment', 'excessItc'] },
  annualRate: { type: Number, required: true },
  dayBasis:   { type: Number, required: true, default: 365 },
})

const WaiverSchema = new Schema<Waiver>({
  returnTypeCode: { type: String, required: true },
  periodFrom:     { type: Date, required: true },
  periodTo:       { type: Date, required: true },
  fileBy:         { type: Date, required: true },
  overrideType:   { type: String, required: true, enum: ['cap', 'perDay', 'full'] },
  overrideValue:  { type: Number, default: null },
})

// ── Root schema ───────────────────────────────────────────────────────────────

const RuleSetSchema = new Schema<IRuleSet>(
  {
    effectiveFrom: { type: Date, required: true },
    effectiveTo:   { type: Date, default: null },
    notification: {
      number: { type: String, required: true },
      title:  { type: String, required: true },
      url:    { type: String, default: '' },
    },
    lateFeeRules:  { type: [LateFeeRuleSchema],  default: [] },
    interestRules: { type: [InterestRuleSchema], default: [] },
    waivers:       { type: [WaiverSchema],       default: [] },
    deletedAt:     { type: Date, default: null },
  },
  { timestamps: true }
)

RuleSetSchema.index({ effectiveFrom: 1, effectiveTo: 1 })

export const RuleSet = model<IRuleSet>('RuleSet', RuleSetSchema)
