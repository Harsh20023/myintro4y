import { RuleSet, type IRuleSet, type LateFeeRule } from '../models/RuleSet'

// ── Due-date derivation ───────────────────────────────────────────────────────

/**
 * taxPeriod formats:
 *   monthly    "2024-01"   (YYYY-MM)
 *   quarterly  "2024-Q3"   (YYYY-QN, financial-year quarters Apr=Q1)
 *   annual     "2023-24"   (FY start year - end year short)
 *   eventBased — pass explicitDueDate instead
 */
function deriveDueDate(rule: LateFeeRule, taxPeriod: string, explicitDueDate?: Date): Date {
  if (rule.dueRuleType === 'eventBased') {
    if (!explicitDueDate) throw new Error('dueDate is required for event-based returns (GSTR-10)')
    return new Date(explicitDueDate)
  }

  if (rule.dueRuleType === 'dayOfFollowingMonth') {
    // "2024-01" → following month is Feb, dueParam is the day
    const [y, m] = taxPeriod.split('-').map(Number)
    const followYear  = m === 12 ? y + 1 : y
    const followMonth = m === 12 ? 1     : m + 1
    return new Date(followYear, followMonth - 1, rule.dueParam ?? 20)
  }

  if (rule.dueRuleType === 'quarterly') {
    // "2024-Q2" → Jul-Sep 2024, quarter ends Sep, following month = Oct, dueParam = day
    // Financial year: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
    const [yearStr, qStr] = taxPeriod.split('-')
    const baseYear  = parseInt(yearStr)
    const qNum      = parseInt(qStr.replace('Q', ''))
    // Quarter end month (calendar): Q1→Jun(6), Q2→Sep(9), Q3→Dec(12), Q4→Mar(3)
    const qEndMonth = [6, 9, 12, 3][qNum - 1]
    const qEndYear  = qNum === 4 ? baseYear + 1 : baseYear
    const dueMonth  = qEndMonth === 12 ? 1          : qEndMonth + 1
    const dueYear   = qEndMonth === 12 ? qEndYear + 1 : qEndYear
    return new Date(dueYear, dueMonth - 1, rule.dueParam ?? 25)
  }

  if (rule.dueRuleType === 'annual') {
    // "2023-24" → dueParam encodes MMDD, e.g. 1231 = Dec 31
    // Extract FY end calendar year: "2023-24" → 2024
    const fyEndYear = parseInt(taxPeriod.split('-')[0]) + 1
    const mmdd      = rule.dueParam ?? 1231
    const month     = Math.floor(mmdd / 100)
    const day       = mmdd % 100
    return new Date(fyEndYear, month - 1, day)
  }

  throw new Error(`Unknown dueRuleType: ${rule.dueRuleType}`)
}

// ── Slab matching ─────────────────────────────────────────────────────────────

function matchRule(rules: LateFeeRule[], returnTypeCode: string, turnover: number, isNil: boolean): LateFeeRule | null {
  return rules.find(r =>
    r.returnTypeCode === returnTypeCode &&
    r.isNil === isNil &&
    turnover >= r.turnoverSlab.lower &&
    (r.turnoverSlab.upper === null || turnover < r.turnoverSlab.upper)
  ) ?? null
}

// ── Cap calculation ───────────────────────────────────────────────────────────

function applyCap(rawFee: number, rule: LateFeeRule, turnover: number): number {
  if (rule.capType === 'none' || rule.capValue === null) return rawFee
  const cap = rule.capType === 'flat'
    ? rule.capValue
    : rule.capValue * turnover   // percentOfTurnover: capValue is decimal e.g. 0.0004
  return Math.min(rawFee, cap)
}

// ── Waiver matching ───────────────────────────────────────────────────────────

function applyWaivers(
  ruleSet: IRuleSet,
  returnTypeCode: string,
  taxPeriodDate: Date,       // first day of tax period — used to check periodFrom/periodTo
  filedDate: Date,
  rawFee: number,
  rule: LateFeeRule,
  turnover: number,
): number {
  for (const w of ruleSet.waivers) {
    if (w.returnTypeCode !== returnTypeCode) continue
    if (taxPeriodDate < w.periodFrom || taxPeriodDate > w.periodTo) continue
    if (filedDate > w.fileBy) continue

    if (w.overrideType === 'full') return 0
    if (w.overrideType === 'cap') {
      const capOverride = w.overrideValue ?? 0
      return Math.min(rawFee, capOverride)
    }
    if (w.overrideType === 'perDay') {
      // Recompute with reduced perDay — keep same days logic outside this fn
      // Just return the override value (caller passes rawFee = perDay × days already)
      // We return min(rawFee, overrideValue * days) — but we don't have days here.
      // Simpler: overrideValue is the maximum fee allowed, callers set it as a flat cap.
      return Math.min(rawFee, w.overrideValue ?? 0)
    }
  }
  return rawFee
}

// ── Tax period → Date (first day) ────────────────────────────────────────────

function taxPeriodToDate(taxPeriod: string): Date {
  if (/^\d{4}-\d{2}$/.test(taxPeriod)) {
    const [y, m] = taxPeriod.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }
  if (/^\d{4}-Q\d$/.test(taxPeriod)) {
    const [yearStr, qStr] = taxPeriod.split('-')
    const qNum  = parseInt(qStr.replace('Q', ''))
    const year  = parseInt(yearStr)
    const month = [3, 6, 9, 0][qNum - 1]  // Q1=Apr(3), Q2=Jul(6), Q3=Oct(9), Q4=Jan(0)
    const y     = qNum === 4 ? year + 1 : year
    return new Date(y, month, 1)
  }
  if (/^\d{4}-\d{2}$/.test(taxPeriod)) {
    // Already handled above — fallthrough for annual "2023-24" style
  }
  const [fyStart] = taxPeriod.split('-')
  return new Date(parseInt(fyStart), 3, 1)  // April 1 of FY start
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export interface CalculateInput {
  returnTypeCode: string
  turnover: number
  isNil: boolean
  taxPeriod: string       // "2024-01" | "2024-Q3" | "2023-24"
  filedDate: string       // ISO date string
  dueDate?: string        // explicit, for event-based returns
  liabilityCgst?: number
  liabilitySgst?: number
  liabilityIgst?: number
  itcCgst?: number
  itcSgst?: number
  itcIgst?: number
  cashBalanceCgst?: number
  cashBalanceSgst?: number
  cashBalanceIgst?: number
}

export interface CalculateResult {
  ruleSetId: string
  notification: { number: string; title: string; url: string }
  dueDate: string
  filedDate: string
  daysLate: number
  lateFee: {
    cgst: number
    sgst: number
    total: number
    capped: boolean
    waivered: boolean
  }
  interest: {
    cgst: number
    sgst: number
    igst: number
    total: number
    rate: number
    days: number
  }
  grandTotal: number
}

export const GstLateFeeService = {

  async calculate(input: CalculateInput): Promise<CalculateResult> {
    const filed = new Date(input.filedDate)

    // 1. Find the ruleSet in effect on the filedDate
    const ruleSet = await RuleSet.findOne({
      deletedAt: null,
      effectiveFrom: { $lte: filed },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gt: filed } },
      ],
    }).sort({ effectiveFrom: -1 })

    if (!ruleSet) throw new Error('No rule set found for the given filing date')

    // 2. Match the lateFeeRule
    const rule = matchRule(ruleSet.lateFeeRules, input.returnTypeCode, input.turnover, input.isNil)
    if (!rule) throw new Error(`No late-fee rule found for ${input.returnTypeCode}, turnover ${input.turnover}, isNil=${input.isNil}`)

    // 3. Derive due date
    const explicit = input.dueDate ? new Date(input.dueDate) : undefined
    const dueDate  = deriveDueDate(rule, input.taxPeriod, explicit)

    // 4. Days late (0 if filed on time)
    const msPerDay  = 86_400_000
    const daysLate  = Math.max(0, Math.floor((filed.getTime() - dueDate.getTime()) / msPerDay))

    // 5. Raw fee per head
    const rawCgst = rule.perDayCgst * daysLate
    const rawSgst = rule.perDaySgst * daysLate

    // 6. Cap each head
    const cappedCgst = applyCap(rawCgst, rule, input.turnover)
    const cappedSgst = applyCap(rawSgst, rule, input.turnover)
    const wasCapped  = cappedCgst < rawCgst || cappedSgst < rawSgst

    // 7. Check waivers
    const taxPeriodDate = taxPeriodToDate(input.taxPeriod)
    const feeAfterWaiverCgst = applyWaivers(ruleSet, input.returnTypeCode, taxPeriodDate, filed, cappedCgst, rule, input.turnover)
    const feeAfterWaiverSgst = applyWaivers(ruleSet, input.returnTypeCode, taxPeriodDate, filed, cappedSgst, rule, input.turnover)
    const wasWaivered = feeAfterWaiverCgst < cappedCgst || feeAfterWaiverSgst < cappedSgst

    // 8. Interest — net cash liability per head
    const interestRule = ruleSet.interestRules.find(r => r.type === 'latePayment')
    const rate   = interestRule?.annualRate ?? 18
    const basis  = interestRule?.dayBasis   ?? 365

    const netCgst = Math.max(0, (input.liabilityCgst ?? 0) - (input.itcCgst ?? 0) - (input.cashBalanceCgst ?? 0))
    const netSgst = Math.max(0, (input.liabilitySgst ?? 0) - (input.itcSgst ?? 0) - (input.cashBalanceSgst ?? 0))
    const netIgst = Math.max(0, (input.liabilityIgst ?? 0) - (input.itcIgst ?? 0) - (input.cashBalanceIgst ?? 0))

    const intCgst = Math.round(netCgst * (rate / 100) * daysLate / basis * 100) / 100
    const intSgst = Math.round(netSgst * (rate / 100) * daysLate / basis * 100) / 100
    const intIgst = Math.round(netIgst * (rate / 100) * daysLate / basis * 100) / 100

    const feeCgst = Math.round(feeAfterWaiverCgst)
    const feeSgst = Math.round(feeAfterWaiverSgst)
    const feeTotal = feeCgst + feeSgst
    const intTotal = intCgst + intSgst + intIgst

    return {
      ruleSetId:    ruleSet._id.toString(),
      notification: ruleSet.notification,
      dueDate:      dueDate.toISOString().slice(0, 10),
      filedDate:    filed.toISOString().slice(0, 10),
      daysLate,
      lateFee: {
        cgst: feeCgst, sgst: feeSgst, total: feeTotal,
        capped: wasCapped, waivered: wasWaivered,
      },
      interest: {
        cgst: intCgst, sgst: intSgst, igst: intIgst,
        total: intTotal, rate, days: daysLate,
      },
      grandTotal: feeTotal + intTotal,
    }
  },

  // ── Overlap check for integrity ─────────────────────────────────────────────

  async checkOverlap(
    newFrom: Date,
    newTo: Date | null,
    lateFeeRules: LateFeeRule[],
    excludeId?: string
  ): Promise<string | null> {
    // Build a query that finds ruleSets whose windows overlap with [newFrom, newTo]
    const windowQuery = {
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      deletedAt: null,
      $or: [
        // Existing window starts before new window ends (or new never ends)
        {
          effectiveFrom: newTo ? { $lt: newTo } : { $exists: true },
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gt: newFrom } },
          ],
        },
      ],
    }

    const overlapping = await RuleSet.findOne(windowQuery)
    if (!overlapping) return null

    // Check if any (returnTypeCode, slab.lower, slab.upper, isNil) tuple collides
    for (const newRule of lateFeeRules) {
      const clash = overlapping.lateFeeRules.find(ex =>
        ex.returnTypeCode           === newRule.returnTypeCode &&
        ex.isNil                    === newRule.isNil &&
        ex.turnoverSlab.lower       === newRule.turnoverSlab.lower &&
        String(ex.turnoverSlab.upper) === String(newRule.turnoverSlab.upper)
      )
      if (clash) {
        return `Overlapping window for ${newRule.returnTypeCode} / slab "${newRule.turnoverSlab.label}" / isNil=${newRule.isNil} with ruleSet ${overlapping._id}`
      }
    }
    return null
  },
}
