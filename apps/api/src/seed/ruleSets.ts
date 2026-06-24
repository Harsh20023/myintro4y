/**
 * Seed data — extracted verbatim from apps/web/src/lib/logic/gst-late-fee.ts
 *
 * Key convention: capValue is the **per-head** limit (CGST or SGST separately).
 * Statutory tables always quote the combined total; divide by 2 for the seed.
 *
 * Run:  npx ts-node src/seed/ruleSets.ts
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { RuleSet } from '../models/RuleSet'

// ── Turnover slabs ────────────────────────────────────────────────────────────

const S = {
  upto1_5Cr:    { label: 'Up to ₹1.5 Cr',       lower: 0,           upper: 15_000_000  },
  from1_5to5Cr: { label: '₹1.5 Cr – ₹5 Cr',     lower: 15_000_000,  upper: 50_000_000  },
  above5Cr:     { label: 'Above ₹5 Cr',           lower: 50_000_000,  upper: null        },
  upto5Cr:      { label: 'AATO up to ₹5 Cr',     lower: 0,           upper: 50_000_000  },
  from5to20Cr:  { label: 'AATO ₹5 Cr – ₹20 Cr', lower: 50_000_000,  upper: 200_000_000 },
  above20Cr:    { label: 'AATO above ₹20 Cr',     lower: 200_000_000, upper: null        },
  any:          { label: 'All taxpayers',          lower: 0,           upper: null        },
}

// ── Quick Reference (source: gst-late-fee.ts + CBIC 19-21/2021 + 07/2023) ───
//
//  Return          Turnover Slab   NIL?  Per Day (C+S)  Cap (total → per-head)
//  GSTR-1/3B       ≤ ₹1.5 Cr      No    ₹25+₹25        ₹2,000  → ₹1,000
//  GSTR-1/3B       ₹1.5-5 Cr      No    ₹25+₹25        ₹5,000  → ₹2,500
//  GSTR-1/3B       > ₹5 Cr        No    ₹25+₹25        ₹10,000 → ₹5,000
//  Any slab        any             Yes   ₹10+₹10        ₹500    → ₹250
//  GSTR-4          any             No    ₹25+₹25        ₹2,000  → ₹1,000
//  GSTR-4          any             Yes   ₹10+₹10        ₹500    → ₹250
//  GSTR-7          any             No    ₹25+₹25        ₹2,000  → ₹1,000
//  GSTR-9          AATO ≤ ₹5 Cr   No    ₹25+₹25        0.04%   → 0.04% per head (0.0004)
//  GSTR-9          AATO ₹5-20 Cr  No    ₹50+₹50        0.04%   → 0.04% per head (0.0004)
//  GSTR-9          AATO > ₹20 Cr  No    ₹100+₹100      0.50%   → 0.25% (0.0025)
//  GSTR-10         any             No    ₹100+₹100      none

// ── Build rows for a monthly return across 3 turnover slabs ──────────────────

function monthlySlabRows(
  code: string, name: string, dueDay: number,
  capBySlabPerHead: [number, number, number],
) {
  const slabKeys = ['upto1_5Cr', 'from1_5to5Cr', 'above5Cr'] as const
  const rows: object[] = []
  slabKeys.forEach((sk, i) => {
    rows.push({
      returnTypeCode: code,
      returnTypeName: name,
      frequency: 'monthly', dueRuleType: 'dayOfFollowingMonth', dueParam: dueDay,
      turnoverSlab: S[sk], isNil: false,
      perDayCgst: 25, perDaySgst: 25,
      capType: 'flat', capValue: capBySlabPerHead[i],
    })
    rows.push({
      returnTypeCode: code,
      returnTypeName: `${name} (NIL)`,
      frequency: 'monthly', dueRuleType: 'dayOfFollowingMonth', dueParam: dueDay,
      turnoverSlab: S[sk], isNil: true,
      perDayCgst: 10, perDaySgst: 10,
      capType: 'flat', capValue: 250,  // ₹500 total ÷ 2
    })
  })
  return rows
}

// ── Seed ──────────────────────────────────────────────────────────────────────

export async function seedRuleSets() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/conceptra')

  const existing = await RuleSet.findOne({ deletedAt: null })
  if (existing) {
    console.log('RuleSet seed already exists — skipping. Delete the document first to re-seed.')
    await mongoose.disconnect()
    return
  }

  // Per-head caps for the 3 GSTR-1/3B turnover slabs (total ÷ 2):
  //   ₹2,000 total → ₹1,000   ₹5,000 total → ₹2,500   ₹10,000 total → ₹5,000
  const STD_CAPS: [number, number, number] = [1000, 2500, 5000]

  const lateFeeRules: object[] = [

    // ── GSTR-1 Monthly — due 11th of following month ─────────────────────────
    ...monthlySlabRows('GSTR-1', 'GSTR-1 (Monthly)', 11, STD_CAPS),

    // ── GSTR-3B Monthly — due 20th of following month ────────────────────────
    ...monthlySlabRows('GSTR-3B', 'GSTR-3B (Monthly)', 20, STD_CAPS),

    // ── GSTR-1 Quarterly / QRMP — due 13th after quarter end ─────────────────
    {
      returnTypeCode: 'GSTR-1Q', returnTypeName: 'GSTR-1 (Quarterly/QRMP)',
      frequency: 'quarterly', dueRuleType: 'quarterly', dueParam: 13,
      turnoverSlab: S.upto1_5Cr, isNil: false,
      perDayCgst: 25, perDaySgst: 25, capType: 'flat', capValue: 1000,
    },
    {
      returnTypeCode: 'GSTR-1Q', returnTypeName: 'GSTR-1 (Quarterly/QRMP — NIL)',
      frequency: 'quarterly', dueRuleType: 'quarterly', dueParam: 13,
      turnoverSlab: S.upto1_5Cr, isNil: true,
      perDayCgst: 10, perDaySgst: 10, capType: 'flat', capValue: 250,
    },

    // ── GSTR-3B Quarterly / QRMP — due 22nd after quarter end ────────────────
    {
      returnTypeCode: 'GSTR-3BQ', returnTypeName: 'GSTR-3B (Quarterly/QRMP)',
      frequency: 'quarterly', dueRuleType: 'quarterly', dueParam: 22,
      turnoverSlab: S.upto1_5Cr, isNil: false,
      perDayCgst: 25, perDaySgst: 25, capType: 'flat', capValue: 1000,
    },
    {
      returnTypeCode: 'GSTR-3BQ', returnTypeName: 'GSTR-3B (Quarterly/QRMP — NIL)',
      frequency: 'quarterly', dueRuleType: 'quarterly', dueParam: 22,
      turnoverSlab: S.upto1_5Cr, isNil: true,
      perDayCgst: 10, perDaySgst: 10, capType: 'flat', capValue: 250,
    },

    // ── GSTR-4 Annual (Composition) — due 30 Apr of following FY ─────────────
    {
      returnTypeCode: 'GSTR-4', returnTypeName: 'GSTR-4 (Annual – Composition)',
      frequency: 'annual', dueRuleType: 'annual', dueParam: 430,  // MMDD = 30-Apr
      turnoverSlab: S.any, isNil: false,
      perDayCgst: 25, perDaySgst: 25, capType: 'flat', capValue: 1000,
    },
    {
      returnTypeCode: 'GSTR-4', returnTypeName: 'GSTR-4 (Annual – Composition, NIL)',
      frequency: 'annual', dueRuleType: 'annual', dueParam: 430,
      turnoverSlab: S.any, isNil: true,
      perDayCgst: 10, perDaySgst: 10, capType: 'flat', capValue: 250,
    },

    // ── GSTR-7 Monthly (TDS) — due 10th of following month ───────────────────
    // Per CBIC 22/2021: ₹50/day total (₹25 CGST + ₹25 SGST), cap ₹2,000 total
    {
      returnTypeCode: 'GSTR-7', returnTypeName: 'GSTR-7 (Monthly – TDS)',
      frequency: 'monthly', dueRuleType: 'dayOfFollowingMonth', dueParam: 10,
      turnoverSlab: S.any, isNil: false,
      perDayCgst: 25, perDaySgst: 25, capType: 'flat', capValue: 1000,
    },

    // ── GSTR-9 Annual — 3 AATO bands (CBIC 07/2023) ──────────────────────────
    // Cap is % of total turnover — stored as per-head decimal (total % ÷ 2)
    //   ≤ ₹5 Cr  & ₹5-20 Cr : 0.04% total → 0.0004 per head  (user-confirmed 2026-06-23)
    //   > ₹20 Cr             : 0.50% total → 0.0025 per head
    {
      returnTypeCode: 'GSTR-9', returnTypeName: 'GSTR-9 (Annual – AATO ≤ ₹5 Cr)',
      frequency: 'annual', dueRuleType: 'annual', dueParam: 1231,  // MMDD = 31-Dec
      turnoverSlab: S.upto5Cr, isNil: false,
      perDayCgst: 25, perDaySgst: 25, capType: 'percentOfTurnover', capValue: 0.0004,
    },
    {
      returnTypeCode: 'GSTR-9', returnTypeName: 'GSTR-9 (Annual – AATO ₹5-20 Cr)',
      frequency: 'annual', dueRuleType: 'annual', dueParam: 1231,
      turnoverSlab: S.from5to20Cr, isNil: false,
      perDayCgst: 50, perDaySgst: 50, capType: 'percentOfTurnover', capValue: 0.0004,
    },
    {
      returnTypeCode: 'GSTR-9', returnTypeName: 'GSTR-9 (Annual – AATO > ₹20 Cr)',
      frequency: 'annual', dueRuleType: 'annual', dueParam: 1231,
      turnoverSlab: S.above20Cr, isNil: false,
      perDayCgst: 100, perDaySgst: 100, capType: 'percentOfTurnover', capValue: 0.0025,
    },

    // ── GSTR-10 Final Return — event-based, no cap ────────────────────────────
    {
      returnTypeCode: 'GSTR-10', returnTypeName: 'GSTR-10 (Final Return)',
      frequency: 'event', dueRuleType: 'eventBased', dueParam: null,
      turnoverSlab: S.any, isNil: false,
      perDayCgst: 100, perDaySgst: 100, capType: 'none', capValue: null,
    },
  ]

  const interestRules = [
    { type: 'latePayment', annualRate: 18, dayBasis: 365 },
    { type: 'excessItc',   annualRate: 24, dayBasis: 365 },
  ]

  await RuleSet.create({
    effectiveFrom: new Date('2021-06-01'),
    effectiveTo:   null,
    notification: {
      number: '19-21/2021-CT & 07/2023-CT',
      title:  'Reduced GST late fees — CBIC notifications 19-21/2021 (GSTR-1/3B) and 07/2023 (GSTR-9)',
      url:    'https://cbic-gst.gov.in/gst-goods-services-rates.html',
    },
    lateFeeRules,
    interestRules,
    waivers: [],
    deletedAt: null,
  })

  console.log(`✓ Seeded ${lateFeeRules.length} late-fee rules + ${interestRules.length} interest rules.`)
  await mongoose.disconnect()
}

if (require.main === module) {
  seedRuleSets().catch(err => { console.error(err); process.exit(1) })
}



















// [
//   {
//     "_id": "6a3a4a1a5212eaac7c08e607",
//     "ref": "new_regime_individual_huf_2026_27",
//     "kind": "slab",
//     "regime": "new",
//     "tax_year": "2026-27",
//     "legal_ref": "Section 115BAC(1A) - Default Regime (Salaried, Business, HUF, AOP)",
//     "brackets_json": [
//       { "from": 0, "to": 400000, "rate": 0 },
//       { "from": 400001, "to": 800000, "rate": 5 },
//       { "from": 800001, "to": 1200000, "rate": 10 },
//       { "from": 1200001, "to": 1600000, "rate": 15 },
//       { "from": 1600001, "to": 2000000, "rate": 20 },
//       { "from": 2000001, "to": 2400000, "rate": 25 },
//       { "from": 2400001, "to": null, "rate": 30 }
//     ],
//     "rebate_note": "Rebate u/S 87A up to ₹60,000 for income up to ₹12 Lakhs. Salaried individuals get an additional ₹75,000 standard deduction.",
//     "surcharge_note": "Surcharge capped at 25% max for high earners; 4% H&E Cess additional.",
//     "createdAt": "2026-06-23T12:05:00.000Z",
//     "updatedAt": "2026-06-23T12:05:00.000Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e610",
//     "ref": "old_regime_standard_2026_27",
//     "kind": "slab",
//     "regime": "old",
//     "tax_year": "2026-27",
//     "legal_ref": "Old Regime Standard (Under 60 Years, HUF, Non-Resident)",
//     "brackets_json": [
//       { "from": 0, "to": 250000, "rate": 0 },
//       { "from": 250001, "to": 500000, "rate": 5 },
//       { "from": 500001, "to": 1000000, "rate": 20 },
//       { "from": 1000001, "to": null, "rate": 30 }
//     ],
//     "rebate_note": "Section 87A rebate applies up to ₹5,00,000 net income. Non-Residents are explicitly excluded from 87A rebate benefits.",
//     "surcharge_note": "Surcharge ranges up to 37% above ₹5 Crore for old regime; 4% H&E Cess additional.",
//     "createdAt": "2026-06-23T12:05:00.000Z",
//     "updatedAt": "2026-06-23T12:05:00.000Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e585",
//     "ref": "old_regime_senior_2026_27",
//     "kind": "slab",
//     "regime": "old",
//     "tax_year": "2026-27",
//     "legal_ref": "Old Regime Slab (Resident Senior Citizen - Age 60 to 79)",
//     "brackets_json": [
//       { "from": 0, "to": 300000, "rate": 0 },
//       { "from": 300001, "to": 500000, "rate": 5 },
//       { "from": 500001, "to": 1000000, "rate": 20 },
//       { "from": 1000001, "to": null, "rate": 30 }
//     ],
//     "rebate_note": "Basic exemption limit is ₹3,00,000 under old regime guidelines.",
//     "surcharge_note": "Surcharge ranges from 10% to 37% + 4% H&E Cess.",
//     "createdAt": "2026-06-23T12:01:10.123Z",
//     "updatedAt": "2026-06-23T12:01:10.123Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e588",
//     "ref": "old_regime_super_senior_2026_27",
//     "kind": "slab",
//     "regime": "old",
//     "tax_year": "2026-27",
//     "legal_ref": "Old Regime Slab (Resident Super Senior Citizen - Age 80+)",
//     "brackets_json": [
//       { "from": 0, "to": 500000, "rate": 0 },
//       { "from": 500001, "to": 1000000, "rate": 20 },
//       { "from": 1000001, "to": null, "rate": 30 }
//     ],
//     "rebate_note": "Basic exemption limit enhanced directly to ₹5,00,000. No 5% tax bracket exists.",
//     "surcharge_note": "Surcharge applies on steps exceeding ₹50L + 4% H&E Cess.",
//     "createdAt": "2026-06-23T12:01:10.123Z",
//     "updatedAt": "2026-06-23T12:01:10.123Z",
//     "__v": 0
//   }
// ]


// [
//   {
//     "_id": "6a3a4a1a5212eaac7c08e591",
//     "ref": "domestic_company_standard_2026_27",
//     "kind": "flat_rate",
//     "regime": "standard",
//     "tax_year": "2026-27",
//     "legal_ref": "Finance Act 2026, Domestic Company Rates",
//     "brackets_json": [
//       { "applies_to": "turnover_under_400_cr_fy24", "rate": 25 },
//       { "applies_to": "standard_domestic_company", "rate": 30 }
//     ],
//     "rebate_note": null,
//     "surcharge_note": "7% if income > ₹1 Cr, 12% if > ₹10 Cr + 4% H&E cess. MAT applies at 14%.",
//     "createdAt": "2026-06-23T12:01:10.123Z",
//     "updatedAt": "2026-06-23T12:01:10.123Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e594",
//     "ref": "domestic_company_concessional_2026_27",
//     "kind": "flat_rate",
//     "regime": "concessional",
//     "tax_year": "2026-27",
//     "legal_ref": "S.115BAA / S.115BAB IT Act 1961",
//     "brackets_json": [
//       { "applies_to": "domestic_company_115BAA", "rate": 22 },
//       { "applies_to": "new_manufacturing_company_115BAB", "rate": 15 }
//     ],
//     "rebate_note": null,
//     "surcharge_note": "Flat 10% Surcharge mandatory across all brackets + 4% H&E cess.",
//     "createdAt": "2026-06-23T12:01:10.123Z",
//     "updatedAt": "2026-06-23T12:01:10.123Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e613",
//     "ref": "foreign_company_2026_27",
//     "kind": "flat_rate",
//     "regime": "standard",
//     "tax_year": "2026-27",
//     "legal_ref": "Finance Act 2026, Foreign Company Base Rates",
//     "brackets_json": [
//       { "applies_to": "foreign_company_standard_income", "rate": 40 }
//     ],
//     "rebate_note": null,
//     "surcharge_note": "2% Surcharge if income > ₹1 Crore, 5% if > ₹10 Crore. 4% H&E Cess additional.",
//     "createdAt": "2026-06-23T12:05:00.000Z",
//     "updatedAt": "2026-06-23T12:05:00.000Z",
//     "__v": 0
//   }
// ]



// [
//   {
//     "_id": "6a3a4a1a5212eaac7c08e597",
//     "ref": "firm_llp_2026_27",
//     "kind": "flat_rate",
//     "regime": null,
//     "tax_year": "2026-27",
//     "legal_ref": "Finance Act 2026, Partnership Firm / LLP Structure",
//     "brackets_json": [
//       { "applies_to": "partnership_firm_or_llp", "rate": 30 }
//     ],
//     "rebate_note": null,
//     "surcharge_note": "12% Surcharge if total income exceeds ₹1 Crore + 4% H&E cess.",
//     "createdAt": "2026-06-23T12:01:10.123Z",
//     "updatedAt": "2026-06-23T12:01:10.123Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e601",
//     "ref": "local_authority_2026_27",
//     "kind": "flat_rate",
//     "regime": null,
//     "tax_year": "2026-27",
//     "legal_ref": "Finance Act 2026, Local Authorities",
//     "brackets_json": [
//       { "applies_to": "local_authority", "rate": 30 }
//     ],
//     "rebate_note": null,
//     "surcharge_note": "12% Surcharge if total income exceeds ₹1 Crore + 4% H&E cess.",
//     "createdAt": "2026-06-23T12:01:10.123Z",
//     "updatedAt": "2026-06-23T12:01:10.123Z",
//     "__v": 0
//   },
//   {
//     "_id": "6a3a4a1a5212eaac7c08e622",
//     "ref": "aop_boi_old_regime_2026_27",
//     "kind": "slab",
//     "regime": "old",
//     "tax_year": "2026-27",
//     "legal_ref": "AOP / BOI Taxation under Normal Provisions",
//     "brackets_json": [
//       { "from": 0, "to": 250000, "rate": 0 },
//       { "from": 250001, "to": 500000, "rate": 5 },
//       { "from": 500001, "to": 1000000, "rate": 20 },
//       { "from": 1000001, "to": null, "rate": 30 }
//     ],
//     "rebate_note": "Applies where individual share of members is known and doesn't trigger maximum marginal rate.",
//     "surcharge_note": "Capped at 15% if all members within the AOP are corporate entities.",
//     "createdAt": "2026-06-23T12:10:00.000Z",
//     "updatedAt": "2026-06-23T12:10:00.000Z",
//     "__v": 0
//   }
// ]

