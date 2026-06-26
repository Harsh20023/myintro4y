/**
 * Seed — AY 2026-27 complete tax data
 * Source: incometax.gov.in (reviewed May-Jun 2026)
 *
 * Run:  npx ts-node src/seed/taxMeta.ts
 *
 * Seeds (in order):
 *  1. TdsSchedule    — tax slabs + rates_in_force
 *  2. TaxSurcharge   — surcharge brackets by entity class
 *  3. TaxMetaYear    — 87A rebate, MAT/AMT, standard deduction
 *  4. TaxDeduction   — all Chapter VI-A + 24(b) deductions
 *  5. TaxReference   — ITR forms, regime switching, special provisions, compliance forms
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { TdsSchedule } from '../models/TdsSchedule'
import { TaxSurcharge } from '../models/TaxSurcharge'
import { TaxMetaYear } from '../models/TaxMetaYear'
import { TaxDeduction } from '../models/TaxDeduction'
import { TaxReference } from '../models/TaxReference'

const TAX_YEAR = '2026-27'

// ── 1. TAX SLABS (→ TdsSchedule) ─────────────────────────────────────────────

const TAX_SLABS = [
  {
    ref: 'new_regime_individual_huf_2026_27',
    kind: 'slab', regime: 'new', tax_year: TAX_YEAR,
    legal_ref: 'Section 115BAC(1A) — Individual / HUF / AOP (not co-op) / BOI / AJP (Default Regime)',
    brackets_json: [
      { from: 0,       to: 400000,  rate: 0  },
      { from: 400001,  to: 800000,  rate: 5  },
      { from: 800001,  to: 1200000, rate: 10 },
      { from: 1200001, to: 1600000, rate: 15 },
      { from: 1600001, to: 2000000, rate: 20 },
      { from: 2000001, to: 2400000, rate: 25 },
      { from: 2400001, to: null,    rate: 30 },
    ],
    rebate_note:
      'Rebate u/s 87A: 100% of income tax up to ₹60,000 if net taxable income ≤ ₹12,00,000. ' +
      'Eligible: Resident Individuals and Non-Resident Individuals ONLY. ' +
      'NOT eligible: HUF, AOP, BOI, AJP, firms, companies, local authorities. ' +
      'Salaried: ₹75,000 standard deduction u/s 16(ia) brings effective zero-tax threshold to ₹12,75,000.',
    surcharge_note:
      'New regime: surcharge CAPPED at 25% (no 37% tier). ' +
      'Enhanced surcharge NOT on income u/s 111A, 112, 112A or Dividend; max 15% on such income. ' +
      '4% Health & Education Cess on (income tax + surcharge).',
  },
  {
    ref: 'old_regime_standard_2026_27',
    kind: 'slab', regime: 'old', tax_year: TAX_YEAR,
    legal_ref: 'Old Regime — Resident Individual under 60 / HUF / Non-Resident Individual (all ages)',
    brackets_json: [
      { from: 0,       to: 250000,  rate: 0  },
      { from: 250001,  to: 500000,  rate: 5  },
      { from: 500001,  to: 1000000, rate: 20 },
      { from: 1000001, to: null,    rate: 30 },
    ],
    rebate_note:
      'Rebate u/s 87A: 100% of income tax up to ₹12,500 if net taxable income ≤ ₹5,00,000. ' +
      'NRIs ARE eligible for 87A (confirmed: incometax.gov.in NRI page). ' +
      'Old regime allows 80C (₹1.5L), 80D, HRA, LTA, home loan interest, and Chapter VI-A deductions.',
    surcharge_note:
      'Old regime: 37% surcharge above ₹5 Crore (vs 25% cap in new regime). ' +
      'Enhanced surcharge NOT on 111A/112/112A/Dividend income (max 15%). 4% H&E Cess.',
  },
  {
    ref: 'old_regime_senior_2026_27',
    kind: 'slab', regime: 'old', tax_year: TAX_YEAR,
    legal_ref: 'Old Regime — Resident Senior Citizen (Age 60 to 79)',
    brackets_json: [
      { from: 0,       to: 300000,  rate: 0  },
      { from: 300001,  to: 500000,  rate: 5  },
      { from: 500001,  to: 1000000, rate: 20 },
      { from: 1000001, to: null,    rate: 30 },
    ],
    rebate_note:
      'Basic exemption: ₹3,00,000. ' +
      '87A rebate: ₹12,500 available if income ≤ ₹5L — net tax nil up to ₹5L. ' +
      '(Tax on ₹3L–₹5L = 5% × ₹2L = ₹10,000 < ₹12,500 — fully offset by rebate.) ' +
      'Enhanced 80D: ₹50,000; 80DDB: ₹1,00,000; 80TTB: ₹50,000 on deposit interest. ' +
      'Advance Tax: exempt if no business income (s.207). No TDS on bank interest up to ₹50,000 per bank (s.194A).',
    surcharge_note: 'Same surcharge as standard individual. 4% H&E Cess.',
  },
  {
    ref: 'old_regime_super_senior_2026_27',
    kind: 'slab', regime: 'old', tax_year: TAX_YEAR,
    legal_ref: 'Old Regime — Resident Super Senior Citizen (Age 80+)',
    brackets_json: [
      { from: 0,       to: 500000,  rate: 0  },
      { from: 500001,  to: 1000000, rate: 20 },
      { from: 1000001, to: null,    rate: 30 },
    ],
    rebate_note:
      'Basic exemption ₹5,00,000 — NO 5% slab. 87A not needed (exemption covers up to ₹5L). ' +
      'Paper filing: may file ITR-1 or ITR-4 offline/paper mode. ' +
      'Advance Tax: exempt if no business income (s.207). ' +
      'Also exempt from filing if age ≥ 75, pension + interest from same specified bank (s.194P).',
    surcharge_note: 'Same surcharge as standard individual. 4% H&E Cess.',
  },
  {
    ref: 'aop_boi_new_regime_2026_27',
    kind: 'slab', regime: 'new', tax_year: TAX_YEAR,
    legal_ref: 'Section 115BAC — AOP (not co-operative societies) / BOI / AJP (Default Regime)',
    brackets_json: [
      { from: 0,       to: 400000,  rate: 0  },
      { from: 400001,  to: 800000,  rate: 5  },
      { from: 800001,  to: 1200000, rate: 10 },
      { from: 1200001, to: 1600000, rate: 15 },
      { from: 1600001, to: 2000000, rate: 20 },
      { from: 2000001, to: 2400000, rate: 25 },
      { from: 2400001, to: null,    rate: 30 },
    ],
    rebate_note:
      '87A NOT available to AOP/BOI/AJP (87A is only for Individuals). ' +
      'Share DETERMINED, no member exceeds basic exemption: taxed at slab rates above. ' +
      'Share DETERMINED, any member exceeds exemption: Maximum Marginal Rate (30%+surcharge+cess). ' +
      'Share INDETERMINATE: MMR or higher rate. ' +
      "Member's share of AOP/BOI profit is EXEMPT in member's hands. " +
      'AMT: adjusted total income > ₹20L → AMT @ 18.5% if normal tax < 18.5%.',
    surcharge_note:
      'SPECIAL: AOP consisting ONLY of corporate members — surcharge capped at 15%. ' +
      'Otherwise same as individual_huf surcharge table. 4% H&E Cess.',
  },
  {
    ref: 'aop_boi_old_regime_2026_27',
    kind: 'slab', regime: 'old', tax_year: TAX_YEAR,
    legal_ref: 'Old Regime — AOP / BOI / AJP Taxation under Normal Provisions',
    brackets_json: [
      { from: 0,       to: 250000,  rate: 0  },
      { from: 250001,  to: 500000,  rate: 5  },
      { from: 500001,  to: 1000000, rate: 20 },
      { from: 1000001, to: null,    rate: 30 },
    ],
    rebate_note:
      '87A NOT available. Share rules same as new regime AOP entry above. ' +
      'AMT: adjusted total income > ₹20L → AMT @ 18.5% if normal tax < 18.5%. ' +
      'Trusts not exempt under relevant provisions are assessed as AOP.',
    surcharge_note:
      'SPECIAL: AOP of ONLY corporate members — surcharge capped at 15%. ' +
      'Otherwise old regime surcharge up to 37%. 4% H&E Cess.',
  },
  {
    ref: 'domestic_company_standard_2026_27',
    kind: 'flat_rate', regime: null, tax_year: TAX_YEAR,
    legal_ref: 'Finance Act 2026 — Domestic Company Standard Rates / Section 115BA',
    brackets_json: [
      { applies_to: 'turnover_under_400_cr_relevant_previous_year', rate: 25,
        note: 'Gross receipts/turnover in the relevant previous year ≤ ₹400 crore' },
      { applies_to: 'opted_section_115BA_manufacturing', rate: 25,
        note: 'Domestic company incorporated after 01-Mar-2016 in manufacturing/production, opts for s.115BA. File Form 10-IB.' },
      { applies_to: 'standard_domestic_company', rate: 30,
        note: 'Any other domestic company not covered above and not opting for 115BAA/115BAB' },
    ],
    rebate_note: '',
    surcharge_note:
      '7% surcharge if income > ₹1Cr and ≤ ₹10Cr; 12% if > ₹10Cr. ' +
      'MAT @ 15% of book profit if normal tax < 15% of book profit. ' +
      'IFSC units (income solely in foreign exchange): MAT @ 9%. ' +
      '115BAA/115BAB companies: EXEMPT from MAT. 4% H&E Cess.',
  },
  {
    ref: 'domestic_company_concessional_2026_27',
    kind: 'flat_rate', regime: null, tax_year: TAX_YEAR,
    legal_ref: 'S.115BAA / S.115BAB IT Act 1961 — Concessional Domestic Company Rates',
    brackets_json: [
      { applies_to: 'domestic_company_opted_115BAA', rate: 22,
        note: 'Existing domestic company opts for 115BAA. No MAT. Flat 10% surcharge mandatory. File Form 10-IC.' },
      { applies_to: 'new_manufacturing_115BAB_business_income', rate: 15,
        note: 'New manufacturing company (incorporated ≥ 01-Oct-2019) opts for 115BAB — BUSINESS income ONLY. File Form 10-ID.' },
      { applies_to: 'new_manufacturing_115BAB_non_business_income', rate: 22,
        note: 'Same 115BAB company — NON-BUSINESS income (interest, capital gains, etc.) taxed at 22%.' },
    ],
    rebate_note:
      'DEDUCTIONS BARRED: 80IA, 80IAB, 80IAC, 80IB, 80IC, 80IE and other profit-linked deductions cannot be claimed. ' +
      'ALLOWED: 80JJAA (new employees) and 80M (inter-corporate dividends) only. ' +
      'Both 115BAA and 115BAB companies: EXEMPT from MAT.',
    surcharge_note:
      'Flat 10% surcharge — MANDATORY for both 115BAA and 115BAB. No income threshold. No marginal relief. 4% H&E Cess.',
  },
  {
    ref: 'foreign_company_2026_27',
    kind: 'flat_rate', regime: null, tax_year: TAX_YEAR,
    legal_ref: 'Finance Act 2026 — Foreign Company Base Rates',
    brackets_json: [
      { applies_to: 'foreign_company_standard_income', rate: 40 },
    ],
    rebate_note: '',
    surcharge_note:
      '2% surcharge if income > ₹1Cr; 5% if > ₹10Cr. ' +
      'Enhanced surcharge NOT on 111A/112/112A income (to extent applicable to NRIs) — max 15%. 4% H&E Cess.',
  },
  {
    ref: 'firm_llp_2026_27',
    kind: 'flat_rate', regime: null, tax_year: TAX_YEAR,
    legal_ref: 'Finance Act 2026 — Partnership Firm / LLP',
    brackets_json: [
      { applies_to: 'partnership_firm_or_llp', rate: 30 },
    ],
    rebate_note:
      'AMT @ 18.5% of Adjusted Total Income if adjusted income > ₹20L and normal tax < 18.5%. ' +
      'Form 29C (from Accountant u/s 115JC) required.',
    surcharge_note:
      '12% surcharge if income > ₹1Cr. Marginal relief available. 4% H&E Cess.',
  },
  {
    ref: 'local_authority_2026_27',
    kind: 'flat_rate', regime: null, tax_year: TAX_YEAR,
    legal_ref: 'Finance Act 2026 — Local Authority (s.2(31)(vi) / s.10(20))',
    brackets_json: [
      { applies_to: 'local_authority', rate: 30 },
    ],
    rebate_note:
      'EXEMPT u/s 10(20): income from House Property, Capital Gains, Other Sources from supply of ' +
      'any commodity/service (NOT water/electricity) WITHIN own jurisdiction. ' +
      'Supply of water or electricity WITHIN OR OUTSIDE own jurisdiction also exempt.',
    surcharge_note:
      '12% surcharge if income > ₹1Cr. Marginal relief available. 4% H&E Cess.',
  },
  {
    ref: 'rif_2026_27',
    kind: 'rates_in_force', regime: null, tax_year: TAX_YEAR,
    legal_ref: 'Finance Act 2026 — First Schedule Part II (TDS / Withholding base rates)',
    brackets_json: [
      { applies_to: 'non_resident_individual', rate: 30 },
      { applies_to: 'foreign_company',         rate: 40 },
      { applies_to: 'interest',                rate: 20 },
      { applies_to: 'other_income',            rate: 30 },
    ],
    rebate_note: '',
    surcharge_note: 'Surcharge + 4% H&E Cess additional, as applicable to the payee class.',
  },
]

// ── 2. SURCHARGE RATES (→ TaxSurcharge) ──────────────────────────────────────

const SURCHARGE_DOCS = [
  {
    tax_year: TAX_YEAR,
    entity_class: 'individual_huf_aop_boi',
    description: 'Surcharge for Individual / HUF / AOP / BOI / AJP',
    brackets_json: {
      new_regime: [
        { income_exceeds: 0,        income_upto: 5000000,  surcharge_pct: 0  },
        { income_exceeds: 5000000,  income_upto: 10000000, surcharge_pct: 10 },
        { income_exceeds: 10000000, income_upto: 20000000, surcharge_pct: 15 },
        { income_exceeds: 20000000, income_upto: 50000000, surcharge_pct: 25 },
        { income_exceeds: 50000000, income_upto: null,     surcharge_pct: 25 }, // capped at 25%
      ],
      old_regime: [
        { income_exceeds: 0,        income_upto: 5000000,  surcharge_pct: 0  },
        { income_exceeds: 5000000,  income_upto: 10000000, surcharge_pct: 10 },
        { income_exceeds: 10000000, income_upto: 20000000, surcharge_pct: 15 },
        { income_exceeds: 20000000, income_upto: 50000000, surcharge_pct: 25 },
        { income_exceeds: 50000000, income_upto: null,     surcharge_pct: 37 },
      ],
    },
    marginal_relief_thresholds: [5000000, 10000000, 20000000, 50000000],
    special_notes: [
      'Enhanced surcharge (25%/37%) NOT on income u/s 111A, 112, 112A, or Dividend — max 15% on such income.',
      'Exception: income u/s 115A/115AB/115AC/115ACA/115E — enhanced surcharge applies.',
      'AOP consisting ONLY of corporate members: surcharge capped at 15%.',
      'New regime: no 37% tier; ₹2Cr–₹5Cr and above ₹5Cr both attract 25%.',
    ],
  },
  {
    tax_year: TAX_YEAR,
    entity_class: 'domestic_company_standard',
    description: 'Surcharge for Domestic Company (Standard / 115BA)',
    brackets_json: {
      brackets: [
        { income_exceeds: 0,          income_upto: 10000000,  surcharge_pct: 0  },
        { income_exceeds: 10000000,   income_upto: 100000000, surcharge_pct: 7  },
        { income_exceeds: 100000000,  income_upto: null,      surcharge_pct: 12 },
      ],
    },
    marginal_relief_thresholds: [10000000, 100000000],
    special_notes: [
      'Marginal relief at both ₹1Cr and ₹10Cr thresholds.',
      'MAT surcharge: same rates apply on MAT liability.',
    ],
  },
  {
    tax_year: TAX_YEAR,
    entity_class: 'domestic_company_concessional',
    description: 'Surcharge for Domestic Company (115BAA / 115BAB)',
    brackets_json: {
      brackets: [
        { income_exceeds: 0, income_upto: null, surcharge_pct: 10 }, // flat 10%, mandatory
      ],
    },
    marginal_relief_thresholds: [],
    special_notes: [
      'Flat 10% surcharge — mandatory regardless of income level.',
      'No marginal relief for 115BAA/115BAB companies.',
      'These companies are also exempt from MAT.',
    ],
  },
  {
    tax_year: TAX_YEAR,
    entity_class: 'foreign_company',
    description: 'Surcharge for Foreign Company',
    brackets_json: {
      brackets: [
        { income_exceeds: 0,          income_upto: 10000000,  surcharge_pct: 0 },
        { income_exceeds: 10000000,   income_upto: 100000000, surcharge_pct: 2 },
        { income_exceeds: 100000000,  income_upto: null,      surcharge_pct: 5 },
      ],
    },
    marginal_relief_thresholds: [10000000, 100000000],
    special_notes: [
      'Enhanced surcharge not on 111A/112/112A income — max 15%.',
      'Marginal relief available.',
    ],
  },
  {
    tax_year: TAX_YEAR,
    entity_class: 'firm_llp',
    description: 'Surcharge for Partnership Firm / LLP',
    brackets_json: {
      brackets: [
        { income_exceeds: 0,        income_upto: 10000000, surcharge_pct: 0  },
        { income_exceeds: 10000000, income_upto: null,     surcharge_pct: 12 },
      ],
    },
    marginal_relief_thresholds: [10000000],
    special_notes: ['Marginal relief: tax + surcharge shall not exceed tax on ₹1Cr plus excess income.'],
  },
  {
    tax_year: TAX_YEAR,
    entity_class: 'local_authority',
    description: 'Surcharge for Local Authority',
    brackets_json: {
      brackets: [
        { income_exceeds: 0,        income_upto: 10000000, surcharge_pct: 0  },
        { income_exceeds: 10000000, income_upto: null,     surcharge_pct: 12 },
      ],
    },
    marginal_relief_thresholds: [10000000],
    special_notes: ['Marginal relief available.'],
  },
]

// ── 3. META YEAR — 87A + MAT/AMT + STD DEDUCTION (→ TaxMetaYear) ─────────────

const META_YEAR_DOC = {
  tax_year: TAX_YEAR,
  rebate_87a: {
    new_regime: {
      max_rebate_amount: 60000,
      income_threshold:  1200000,
      rebate_type: '100% of income tax payable, max ₹60,000',
      description:
        'Net taxable income ≤ ₹12L → zero tax. Salaried after ₹75K std deduction → zero tax up to ₹12.75L.',
      eligible:     ['Resident Individual', 'Non-Resident Individual'],
      not_eligible: ['HUF', 'AOP', 'BOI', 'AJP', 'Firm/LLP', 'Domestic Company', 'Foreign Company', 'Local Authority'],
    },
    old_regime: {
      max_rebate_amount: 12500,
      income_threshold:  500000,
      rebate_type: '100% of income tax payable, max ₹12,500',
      description:
        'Net taxable income ≤ ₹5L → zero tax. ' +
        'Senior (60–79): tax on ₹3L–₹5L = ₹10,000; rebate covers fully → zero tax up to ₹5L. ' +
        'Super Senior (80+): ₹5L basic exemption → zero tax; 87A not needed.',
      eligible:     ['Resident Individual', 'Non-Resident Individual'],
      not_eligible: ['HUF', 'AOP', 'BOI', 'AJP', 'Firm/LLP', 'Domestic Company', 'Foreign Company', 'Local Authority'],
    },
  },
  mat_amt: {
    mat: {
      section: '115JB',
      description: 'Minimum Alternate Tax — Companies',
      rate_pct: 15,
      base: 'book_profit',
      triggers_when: 'Normal tax < 15% of book profit',
      applicable_to: ['Domestic Company (standard)', 'Domestic Company (115BA)'],
      exempt: ['Company opted for 115BAA', 'Company opted for 115BAB'],
      special_cases: [
        { entity: 'IFSC unit — income solely in convertible foreign exchange', rate_pct: 9 },
      ],
      surcharge_cess: 'Surcharge (at company rate) and 4% H&E Cess apply on MAT liability also.',
      form: 'Form 29B — Accountant report certifying book profit computation (u/s 115JB)',
    },
    amt: {
      section: '115JC',
      description: 'Alternate Minimum Tax — Non-company assessees',
      rate_pct: 18.5,
      base: 'adjusted_total_income',
      triggers_when: 'Adjusted total income > ₹20,00,000 AND normal tax < 18.5% of adjusted total income',
      applicable_to: ['Firm/LLP', 'AOP', 'BOI', 'AJP', 'Individuals (with profit-linked deductions)'],
      surcharge_cess: 'Surcharge (at entity rate) and 4% H&E Cess apply on AMT liability also.',
      form: 'Form 29C — Accountant report u/s 115JC',
      note: 'Adjusted total income = total income + deductions claimed u/s 80H–80RRB, 10AA, 35AD etc.',
    },
  },
  standard_deduction: {
    salaried_new_regime: {
      section: '16(ia)',
      amount: 75000,
      regime: 'new',
      description:
        '₹75,000 standard deduction under new regime (enhanced from ₹50,000 by Finance Act 2024). ' +
        'Makes effective zero-tax threshold ₹12,75,000.',
    },
    salaried_old_regime: {
      section: '16(ia)',
      amount: 50000,
      regime: 'old',
      description: '₹50,000 standard deduction under old regime.',
    },
    family_pension: {
      section: '57(iia)',
      max_amount: 25000,
      regime: 'both',
      rate_fraction: '1/3',
      description: 'Lower of ₹25,000 or 1/3rd of family pension received.',
    },
  },
}

// ── 4. DEDUCTIONS (→ TaxDeduction) ───────────────────────────────────────────

const DEDUCTION_DOCS = [
  {
    tax_year: TAX_YEAR, section: '24(b)', regime: 'both',
    name: 'Interest on Housing Loan / Home Improvement Loan',
    applicable_to: ['Individual', 'HUF'],
    data: {
      new_regime: {
        allowed_for: ['Let-out property only'],
        limit: null,
        limit_desc: 'Actual interest — no cap',
        restriction: 'Loss under Income from House Property CANNOT be set off against any other head and CANNOT be carried forward under new regime.',
        self_occupied: 'NO deduction for self-occupied property under new regime.',
      },
      old_regime: {
        property_conditions: [
          { property_type: 'Self-Occupied', loan_type: 'Construction or purchase', loan_sanction: 'On or after 01-Apr-1999', limit: 200000 },
          { property_type: 'Self-Occupied', loan_type: 'Repairs of house property', loan_sanction: 'On or after 01-Apr-1999', limit: 30000 },
          { property_type: 'Self-Occupied', loan_type: 'Construction or purchase', loan_sanction: 'Before 01-Apr-1999', limit: 30000 },
          { property_type: 'Self-Occupied', loan_type: 'Repairs', loan_sanction: 'Before 01-Apr-1999', limit: 30000 },
          { property_type: 'Let-Out', loan_type: 'Any', loan_sanction: 'Any time', limit: null,
            limit_desc: 'Actual — no cap. Max set-off loss against other heads = ₹2L; balance carried forward up to 8 AYs.' },
        ],
      },
      itr_fields_required: ['Loan source', 'Institution/person name', 'Loan account number', 'Date of sanction', 'Total loan amount', 'Loan outstanding at year-end', 'Interest u/s 24(b)'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80C / 80CCC / 80CCD(1)', regime: 'old',
    name: 'Life Insurance, PF, NSC, Tuition Fees, Housing Loan Principal, NPS (combined)',
    applicable_to: ['Individual', 'HUF'],
    data: {
      combined_limit: 150000,
      components: {
        '80C': {
          instruments: [
            'Life Insurance Premium', 'Provident Fund (EPF/PPF/VPF)', 'Subscription to equity shares (ELSS)',
            'Tuition fees for children', 'National Savings Certificate (NSC)', 'Housing Loan Principal repayment',
            '5-year fixed deposits with banks/post office', 'Senior Citizens Savings Scheme',
            'Sukanya Samriddhi Account', 'Other notified instruments',
          ],
        },
        '80CCC': 'Annuity plan of LIC or another insurer for Pension Scheme',
        '80CCD(1)': "Employee's own contribution to NPS (Pension Scheme of Central Govt)",
      },
    },
  },
  {
    tax_year: TAX_YEAR, section: '80CCD(1B)', regime: 'old',
    name: 'Additional NPS Contribution (over and above 80CCD(1))',
    applicable_to: ['Individual'],
    data: {
      limit: 50000,
      note: 'Deduction EXCLUDING amount already claimed u/s 80CCD(1). Also allowed for minor NPS account by parent/guardian.',
      itr_fields_required: ['Amount of contribution', 'PRAN of taxpayer'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80CCD(2)', regime: 'both',
    name: "Employer's Contribution to NPS",
    applicable_to: ['Individual (salaried)'],
    data: {
      new_regime: { limit_pct_of_salary: 14, applies_to_all_employers: true, note: '14% of salary for ALL employer categories under new regime.' },
      old_regime: {
        limits_by_employer: [
          { employer_type: 'Central or State Government', limit_pct_of_salary: 14 },
          { employer_type: 'PSU or Others',               limit_pct_of_salary: 10 },
        ],
      },
    },
  },
  {
    tax_year: TAX_YEAR, section: '80CCH', regime: 'both',
    name: 'Contribution to Agniveer Corpus Fund (Agnipath Scheme)',
    applicable_to: ['Individual enrolled in Agnipath Scheme'],
    data: {
      limit: '100% of amount paid/deposited',
      note: 'Individual enrolled in Agnipath Scheme on/after 01-Nov-2022. Govt contribution also fully deductible. Available under BOTH regimes.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80D', regime: 'old',
    name: 'Health Insurance Premium & Preventive Health Check-up',
    applicable_to: ['Individual', 'HUF'],
    data: {
      limits: {
        self_spouse_children_below_60: 25000,
        self_spouse_children_senior:   50000,
        parents_below_60:              25000,
        parents_senior:                50000,
        medical_expenditure_senior_no_insurance_self:    50000,
        medical_expenditure_senior_no_insurance_parents: 50000,
      },
      preventive_health_checkup: { limit: 5000, note: 'Included WITHIN the above limits (not additional)' },
      huf_note: 'For HUF: ₹25,000 for members below 60, ₹50,000 for members above 60.',
      itr_fields_required: ['Name of Insurer', 'Policy Number', 'Health Insurance amount'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80DD', regime: 'old',
    name: 'Maintenance/Medical Treatment of Disabled Dependent',
    applicable_to: ['Individual', 'HUF'],
    data: {
      limits: [
        { disability_type: 'Disability (40–79%)',      flat_deduction: 75000  },
        { disability_type: 'Severe Disability (80%+)', flat_deduction: 125000 },
      ],
      note: 'Flat deduction irrespective of actual expense incurred.',
      itr_fields_required: ['Nature of Disability', 'Type of Disability', 'Amount', 'PAN of dependent', 'Aadhaar of dependent', 'Acknowledgement no. of Form 10IA (if applicable)', 'UDID number (if available)'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80DDB', regime: 'old',
    name: 'Medical Treatment of Self or Dependent — Specified Diseases',
    applicable_to: ['Individual', 'HUF'],
    data: {
      limits: [
        { category: 'General (below 60)',    limit: 40000  },
        { category: 'Senior Citizen (60+)',  limit: 100000 },
      ],
      itr_fields_required: ['Type of user', 'Name of specified disease', 'Amount'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80E', regime: 'old',
    name: 'Interest on Education Loan (Self or Relative)',
    applicable_to: ['Individual'],
    data: {
      limit: '100% of interest paid — no upper cap',
      note: 'Only INTEREST component deductible. Principal is not. Loan from bank/institution.',
      itr_fields_required: ['Loan source', 'Institution name', 'Loan account number', 'Date of sanction', 'Total loan amount', 'Loan outstanding at year-end', 'Interest u/s 80E'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80EE', regime: 'old',
    name: 'Interest on Housing Loan — Loan Sanctioned Apr 2016 to Mar 2017',
    applicable_to: ['Individual'],
    data: {
      limit: 50000,
      note: 'Additional deduction over 24(b). Loan from bank/financial institution only. Cannot claim BOTH 80EE and 80EEA.',
      itr_fields_required: ['Loan source', 'Institution name', 'Loan account number', 'Date of sanction', 'Total loan amount', 'Loan outstanding at year-end', 'Interest u/s 80EE'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80EEA', regime: 'old',
    name: 'Interest on Housing Loan — First-Time Buyer, Loan Sanctioned Apr 2019 to Mar 2022',
    applicable_to: ['Individual only (not HUF)'],
    data: {
      limit: 150000,
      note: 'ONLY if 24(b) deduction limit is ALREADY EXHAUSTED. Cannot claim if 80EE also claimed. First-time buyer only.',
      itr_fields_required: ['Stamp value of residential house property', 'Loan source', 'Institution name', 'Loan account number', 'Date of sanction', 'Total loan amount', 'Loan outstanding at year-end', 'Interest u/s 80EEA'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80EEB', regime: 'old',
    name: 'Interest on Loan for Electric Vehicle — Loan Sanctioned Apr 2019 to Mar 2023',
    applicable_to: ['Individual'],
    data: {
      limit: 150000,
      itr_fields_required: ['Institution name', 'Loan account number', 'Date of sanction', 'Total loan amount', 'Loan outstanding at year-end', 'Interest u/s 80EEB', 'Vehicle Registration Number'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80G', regime: 'old',
    name: 'Donations to Prescribed Funds, Charitable Institutions',
    applicable_to: ['Individual', 'HUF', 'Firm', 'Company', 'AOP', 'Local Authority'],
    data: {
      deduction_categories: [
        { category: 'Without qualifying limit — 100% deduction', example: 'PM Relief Fund, National Defence Fund' },
        { category: 'Without qualifying limit — 50% deduction',  example: 'Jawaharlal Nehru Memorial Fund' },
        { category: 'Subject to qualifying limit — 100% deduction', example: 'Various notified institutions' },
        { category: 'Subject to qualifying limit — 50% deduction',  example: 'Various state relief funds' },
      ],
      note: 'No deduction on CASH donations exceeding ₹2,000.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80GG', regime: 'old',
    name: 'Rent Paid — for Self-Employed or if HRA is not part of Salary',
    applicable_to: ['Individual'],
    data: {
      limit: 'LEAST of: (a) Rent paid minus 10% of total income, (b) ₹5,000 per month, (c) 25% of total income',
      limit_per_month: 5000,
      exclusions_from_total_income: ['LTCG', 'STCG u/s 111A', 'Income u/s 115A or 115D'],
      form_required: 'Form 10BA — MANDATORY. Acknowledgement number to be entered in Schedule 80GG in ITR.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80GGA', regime: 'old',
    name: 'Donations for Scientific Research or Rural Development',
    applicable_to: ['Individual', 'HUF', 'Firm', 'AOP', 'Local Authority'],
    data: {
      eligible_donees: [
        'Research Association / University for Scientific Research or Social Science/Statistical Research',
        'Institution for Rural Development or Conservation of Natural Resources / Afforestation',
        'PSU or Local Authority approved by National Committee for eligible projects',
        'Notified Central Govt funds for Afforestation, Rural Development, National Urban Poverty Eradication',
      ],
      note: 'No deduction on CASH donations > ₹2,000. NOT allowed if GTI includes Profits/Gains from Business/Profession.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80GGB', regime: 'old',
    name: 'Contribution to Political Party or Electoral Trust — Companies',
    applicable_to: ['Domestic Company'],
    data: { limit: 'Full amount, through any mode other than CASH', note: 'Cash contributions: no deduction.' },
  },
  {
    tax_year: TAX_YEAR, section: '80GGC', regime: 'old',
    name: 'Contribution to Political Party or Electoral Trust — Non-Company Assessees',
    applicable_to: ['Individual', 'HUF', 'Firm', 'AOP', 'Local Authority'],
    data: { limit: 'Full amount, through any mode other than CASH', note: 'Cash contributions: no deduction.' },
  },
  {
    tax_year: TAX_YEAR, section: '80IA', regime: 'old',
    name: 'Profits from Infrastructure / Power Undertakings',
    applicable_to: ['Company (Indian)', 'Any undertaking (industrial parks/power)'],
    data: {
      limit: '100% of profit for 10 consecutive AYs within a period of 15 AYs (20 AYs in some cases)',
      note: 'NO deduction to enterprise starting development/operation on or after 01-Apr-2017. Requires Form 10-CCB audit report.',
      barred_for: ['Companies opted for 115BAA or 115BAB'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80IAC', regime: 'old',
    name: 'Profits of Eligible Start-ups from Specified Business',
    applicable_to: ['Eligible Start-up (Company or LLP)'],
    data: {
      limit: '100% of profit for 3 consecutive AYs out of 10 AYs from year of incorporation',
      barred_for: ['Companies opted for 115BAA or 115BAB'],
    },
  },
  {
    tax_year: TAX_YEAR, section: '80IB', regime: 'old',
    name: 'Profits from Specified Industrial Undertakings',
    applicable_to: ['Individual', 'HUF', 'Firm', 'Company', 'AOP'],
    data: {
      eligible_businesses: [
        'Commercial production / refining of mineral oil [s.80IB(9)]',
        'Developing and building housing projects [s.80IB(10)]',
        'Processing, preservation and packaging of fruits/vegetables/meat/dairy/poultry/marine [s.80IB(11A)]',
        'Integrated handling/storage/transportation of food grains [s.80IB(11A)]',
      ],
      limit: '100% / 25% of profit for 5/7/10 years as per conditions for different undertaking types',
      form_required: 'Form 10-CCB',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80IBA', regime: 'old',
    name: 'Profits from Developing and Building Housing Projects',
    applicable_to: ['Individual', 'HUF', 'Firm', 'Company', 'AOP'],
    data: { limit: '100% of profits, subject to conditions' },
  },
  {
    tax_year: TAX_YEAR, section: '80IC', regime: 'old',
    name: 'Undertakings in Himachal Pradesh, Sikkim, Uttaranchal, North-Eastern States',
    applicable_to: ['Any assessee'],
    data: {
      limit: '100% for first 5 AYs; 25% (30% for companies) for next 5 AYs',
      note: 'Manufacturing or production of specified articles.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80IE', regime: 'old',
    name: 'Undertakings set up in North-Eastern States',
    applicable_to: ['Any assessee'],
    data: { limit: '100% of profits for 10 AYs, subject to conditions' },
  },
  {
    tax_year: TAX_YEAR, section: '80JJA', regime: 'both',
    name: 'Profits from Collecting and Processing Biodegradable Waste',
    applicable_to: ['Individual', 'HUF', 'Firm', 'Company', 'AOP', 'Local Authority'],
    data: { limit: '100% of profits for 5 consecutive AYs' },
  },
  {
    tax_year: TAX_YEAR, section: '80JJAA', regime: 'both',
    name: 'Employment of New Workers / Employees (assessees u/s 44AB)',
    applicable_to: ['Firm', 'Company (including 115BAA/115BAB)', 'AOP (subject to 44AB)'],
    data: {
      limit: '30% of additional employee cost for 3 AYs',
      note: 'Subject to conditions on employee headcount and salary levels.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80M', regime: 'both',
    name: 'Inter-Corporate Dividend Deduction',
    applicable_to: ['Domestic Company'],
    data: {
      limit: 'Dividend RECEIVED from another domestic/foreign company or business trust, to the extent of dividend DISTRIBUTED to own shareholders (at least 1 month before ITR due date).',
      note: 'Prevents cascading double taxation on dividend pass-through. Allowed for 115BAA/115BAB companies.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80QQB', regime: 'old',
    name: "Royalty Income — Resident Authors (not textbooks)",
    applicable_to: ['Resident Individual (Author/Joint Author)'],
    data: {
      limit: 'Royalty income up to ₹3,00,000 (whichever is lower — actual royalty or ₹3L)',
      note: 'Deduction claimed here cannot also be claimed elsewhere in the IT Act.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80RRB', regime: 'old',
    name: 'Royalty on Patents — Resident Individual',
    applicable_to: ['Resident Individual — First Inventor / Co-owner under Patents Act 1970'],
    data: {
      limit: 'Lower of actual royalty or ₹3,00,000',
      note: 'Deduction claimed here cannot also be claimed elsewhere in the IT Act.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80TTA', regime: 'old',
    name: 'Interest on Savings Bank Account — Non-Senior Citizens',
    applicable_to: ['Individual below 60', 'HUF'],
    data: {
      limit: 10000,
      note: 'Only SAVINGS account interest. Fixed deposit interest NOT covered (use 80TTB for seniors). Senior citizens (60+) CANNOT claim 80TTA.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80TTB', regime: 'old',
    name: 'Interest on ALL Deposits — Resident Senior Citizens (60+)',
    applicable_to: ['Resident Senior Citizen (60+)'],
    data: {
      limit: 50000,
      note: 'Covers BOTH savings account and fixed deposit interest. Deposits with banks, post office, or co-operative banks. Cannot claim 80TTA if claiming 80TTB.',
    },
  },
  {
    tax_year: TAX_YEAR, section: '80U', regime: 'old',
    name: 'Disability — Resident Individual Taxpayer (Self)',
    applicable_to: ['Resident Individual'],
    data: {
      limits: [
        { disability_type: 'Disability (40–79%)',      flat_deduction: 75000  },
        { disability_type: 'Severe Disability (80%+)', flat_deduction: 125000 },
      ],
      note: 'Flat deduction irrespective of actual expense. For SELF (not dependent — compare 80DD for dependent).',
      itr_fields_required: ['Nature of Disability', 'Type of Disability', 'Amount', 'Acknowledgement no. of Form 10IA (if applicable)', 'UDID number (if available)'],
    },
  },
]

// ── 5. REFERENCE DOCS (→ TaxReference) ───────────────────────────────────────

const REFERENCE_DOCS = [
  {
    tax_year: TAX_YEAR,
    category: 'itr_forms',
    data: [
      {
        form: 'ITR-1', name: 'SAHAJ',
        applicable_to: ['Resident Individual (NOT NOR)'],
        not_applicable_to: ['HUF', 'Non-Resident', 'Not-Ordinarily Resident', 'Company', 'Firm'],
        income_sources_allowed: ['Salary / Pension', 'ONE House Property', 'Other Sources (Interest, Family Pension, Dividend)', 'Agricultural income up to ₹5,000', 'Capital Gains u/s 112A up to ₹1,25,000'],
        total_income_ceiling: 5000000,
        cannot_be_used_if: ['Director in a company', 'Has Short-Term Capital Gains', 'LTCG u/s 112A exceeds ₹1,25,000', 'Held unlisted equity shares at any time during previous year', 'Has any asset (including financial interest) located outside India', 'Has signing authority in any account located outside India', 'Has income from any source outside India', 'TDS deducted u/s 194N', 'ESOP tax deferred', 'Has brought-forward loss or loss to carry forward', 'Total income exceeds ₹50 lakhs'],
        super_senior_paper_filing: true,
      },
      {
        form: 'ITR-2',
        applicable_to: ['Individual (Resident, NOR, NRI)', 'HUF'],
        income_sources: 'Any head EXCEPT Profits and Gains of Business or Profession',
        use_when: 'Not eligible for ITR-1',
      },
      {
        form: 'ITR-3',
        applicable_to: ['Individual (Resident, NOR, NRI)', 'HUF'],
        income_sources: ['Salary / Pension', 'House Property', 'Profits or Gains of Business or Profession', 'Capital Gains', 'Income from Other Sources'],
        use_when: 'Not eligible for ITR-1, ITR-2, or ITR-4',
      },
      {
        form: 'ITR-4', name: 'SUGAM',
        applicable_to: ['Resident Individual (not NOR)', 'Resident HUF', 'Resident Firm (not LLP)'],
        use_when: 'Eligible to declare Business/Profession income on PRESUMPTIVE basis u/s 44AD / 44ADA / 44AE',
        total_income_ceiling: 5000000,
        presumptive_sections: ['44AD', '44ADA', '44AE'],
        cannot_be_used_if: ['Director in a company', 'Short-Term Capital Gains', 'LTCG u/s 112A > ₹1,25,000', 'Unlisted equity shares held', 'Asset outside India', 'Signing authority in account outside India', 'Income from outside India', 'ESOP tax deferred', 'Brought-forward losses', 'Total income > ₹50 lakhs', 'Any income chargeable at special rate'],
        super_senior_paper_filing: true,
      },
      {
        form: 'ITR-5',
        applicable_to: ['Firm', 'LLP', 'AOP', 'BOI', 'AJP', 'Local Authority', 'Cooperative Society', 'Society registered under Societies Registration Act 1860', 'Trust (other than trusts required to file ITR-7)', 'Estate of Deceased Person / Insolvent', 'Business Trust (s.139(4E))', 'Investment Fund (s.139(4F))'],
        cannot_be_used_if: 'Required to file u/s 139(4A), 139(4B), or 139(4D)',
      },
      {
        form: 'ITR-6',
        applicable_to: ['Companies other than those claiming exemption u/s 11'],
        company_types_covered: ['Indian Company', 'Body corporate incorporated under laws of a country outside India', 'Any institution/association/body declared by CBDT to be a company'],
      },
      {
        form: 'ITR-7',
        applicable_to: ['Persons required to furnish returns u/s 139(4A), 139(4B), 139(4C), 139(4D)'],
        sections: [
          { section: '139(4A)', description: 'Income from property held under Trust for charitable or religious purposes' },
          { section: '139(4B)', description: 'Chief Executive Officer of every Political Party' },
          { section: '139(4C)', description: 'Research Associations, News Agencies, etc. mentioned u/s 10' },
          { section: '139(4D)', description: 'Universities, Colleges, or Institutions referred u/s 35' },
        ],
      },
    ],
  },
  {
    tax_year: TAX_YEAR,
    category: 'regime_switching',
    data: {
      default_regime: 'new',
      default_regime_legal_ref: 'Section 115BAC — applicable from AY 2024-25 onward',
      default_regime_scope: 'Individual, HUF, AOP (not co-operative societies), BOI, Artificial Juridical Person',
      non_business_taxpayers: {
        description: 'Taxpayers WITHOUT income from Business or Profession',
        can_switch_every_year: true,
        how_to_switch: 'Exercise option directly in the ITR filed on or before due date u/s 139(1)',
        form_required: null,
        note: 'Can switch back and forth between old and new regime every year freely.',
      },
      business_taxpayers: {
        description: 'Taxpayers WITH income from Business or Profession',
        can_switch_every_year: false,
        how_to_opt_out_of_new_regime: { form: 'Form 10-IEA', deadline: 'On or before due date u/s 139(1)', note: 'File Form 10-IEA to opt OUT of new (default) regime and INTO old regime' },
        how_to_re_enter_new_regime:   { form: 'Form 10-IEA', deadline: 'On or before due date u/s 139(1)', note: 'File Form 10-IEA again to withdraw from old regime and RE-ENTER new regime' },
        re_entry_restrictions: {
          available_from: 'Only from the SUBSEQUENT Assessment Year (not same AY)',
          lifetime_limit: 'Can re-enter new regime ONLY ONCE in a lifetime',
          consequence: 'Once re-entered new regime, CANNOT switch back to old regime again',
        },
      },
      cooperative_societies: {
        new_scheme: 'Section 115BAE — Concessional rate @ 15%',
        how_to_opt: 'Form 10-IFA',
        irrevocable: true,
        note: 'Once option u/s 115BAE is exercised, it CANNOT be withdrawn for the same or any other previous year.',
        form_reference: 'Form 10-IFA (Notification No. 83/2023 dated 29-Sep-2023)',
      },
    },
  },
  {
    tax_year: TAX_YEAR,
    category: 'special_provisions',
    data: {
      section_194P_senior_filing_exemption: {
        section: '194P',
        title: 'Filing Exemption for Specified Senior Citizens (Age 75+)',
        conditions: ['Senior citizen must be aged 75 or above', 'Must be RESIDENT in the previous year', 'Income: ONLY pension income AND interest income', 'Interest must accrue/be earned from the SAME specified bank in which pension is received', 'Senior citizen submits a declaration to the specified bank', 'Bank must be a "specified bank" as notified by the Central Government'],
        effect: 'Once specified bank deducts TDS (considering Chapter VI-A deductions and 87A rebate), there is NO requirement to furnish Income Tax Return.',
      },
      section_207_advance_tax_relief: {
        section: '207',
        title: 'Relief from Advance Tax for Resident Senior Citizens',
        applicable_to: 'Resident Senior Citizens (60+ years)',
        condition: 'Must have NO income from Business or Profession',
        effect: 'Not liable to pay Advance Tax. Interest u/s 234B and 234C NOT applicable.',
      },
      section_115BAE_manufacturing_cooperative: {
        section: '115BAE',
        title: 'Concessional Tax Rate — New Manufacturing Co-operative Societies',
        rate_pct: 15,
        eligibility: ['Co-operative society engaged in manufacturing or production', 'Registered on or after 01-Apr-2023', 'Must commence manufacturing or production on or before 31-Mar-2024'],
        form_to_opt: 'Form 10-IFA',
        irrevocable: true,
      },
      tds_194A_senior_bank_interest: {
        section: '194A',
        title: 'No TDS on Bank Interest for Senior Citizens — up to ₹50,000',
        note: 'No TDS on interest payments up to ₹50,000 by banks, post offices, or co-operative banks to a Senior Citizen. Limit computed for EACH bank individually.',
      },
      section_89_1_salary_arrears_relief: {
        section: '89(1)',
        title: 'Relief for Salary in Arrears or Advance',
        description: 'Where salary is paid in arrears or advance, relief can be claimed u/s 89(1) to reduce tax burden caused by bunching of income.',
        form: 'Form 10E — must be filed BEFORE filing ITR to claim this relief.',
        covers: ['Arrears / Advance Salary', 'Gratuity', 'Compensation on Termination', 'Commutation of Pension'],
      },
      paper_filing_super_senior: {
        title: 'Paper/Offline Filing Option — Super Senior Citizens (80+)',
        applicable_to: 'Resident Super Senior Citizens (80 years or above)',
        forms_eligible: ['ITR-1', 'ITR-4'],
        note: 'Super senior citizens have the OPTION to submit ITR-1 or ITR-4 in paper/offline mode.',
      },
      marginal_relief_surcharge: {
        title: 'Marginal Relief from Surcharge',
        description: 'Ensures that the additional tax + surcharge arising from marginally exceeding a threshold does not exceed the income by which the threshold is exceeded.',
        individual_huf_thresholds: [
          { exceeds: 5000000,  upto: 10000000, relief: 'Tax + surcharge ≤ Tax on ₹50L + (income − ₹50L)' },
          { exceeds: 10000000, upto: 20000000, relief: 'Tax + surcharge ≤ Tax on ₹1Cr + (income − ₹1Cr)' },
          { exceeds: 20000000, upto: 50000000, relief: 'Tax + surcharge ≤ Tax on ₹2Cr + (income − ₹2Cr)' },
          { exceeds: 50000000, upto: null, old_regime_only: true, relief: 'Tax + surcharge ≤ Tax on ₹5Cr + (income − ₹5Cr) [OLD REGIME ONLY]' },
        ],
        no_marginal_relief_for: ['Companies opted for 115BAA', 'Companies opted for 115BAB'],
      },
    },
  },
  {
    tax_year: TAX_YEAR,
    category: 'compliance_forms',
    data: [
      { form: 'Form 12BB',   section: '192',   submitted_by: 'Employee to Employer', purpose: 'Particulars of claims for TDS deduction — HRA, LTC, home loan interest, tax-saving investments', frequency: 'Annually / as needed' },
      { form: 'Form 16',     section: '203',   issued_by: 'Employer to Employee', purpose: 'Certificate of TDS on Salary — income, deductions, exemptions, and tax deducted', frequency: 'Annual' },
      { form: 'Form 16A',    section: '203',   issued_by: 'Deductor to Deductee', purpose: 'TDS Certificate on income other than salary', frequency: 'Quarterly' },
      { form: 'Form 26AS',   issued_by: 'Income Tax Department', purpose: 'Consolidated TDS / TCS statement for the taxpayer', access: 'e-Filing portal → e-File → Income Tax Return → View Form 26AS' },
      { form: 'AIS',         issued_by: 'Income Tax Department', purpose: 'Comprehensive statement: TDS/TCS, SFT transactions, taxes paid, demands/refunds, pending proceedings, GST info', access: 'e-Filing portal → AIS' },
      { form: 'Form 15G',    section: '197A',  submitted_by: 'Resident Individual below 60 / HUF to Bank', purpose: 'Declaration for no TDS deduction on interest income if income below basic exemption limit' },
      { form: 'Form 15H',    section: '197A',  submitted_by: 'Resident Individual aged 60 or more to Bank', purpose: 'Declaration for no TDS deduction on interest income' },
      { form: 'Form 10E',    section: '89(1)', submitted_by: 'Employee to Income Tax Department (in ITR)', purpose: 'Furnishing particulars for claiming relief u/s 89(1) — MUST be filed before claiming relief in ITR', covers: ['Arrears/Advance Salary', 'Gratuity', 'Compensation on Termination', 'Commutation of Pension'] },
      { form: 'Form 67',     submitted_by: 'Taxpayer — on or before due date u/s 139(1)', purpose: 'Statement of income from a country outside India and Foreign Tax Credit claim' },
      { form: 'Form 10-IEA', submitted_by: 'Business/profession taxpayer', purpose: 'To opt OUT of new tax regime or to RE-ENTER new regime', deadline: 'On or before due date u/s 139(1)' },
      { form: 'Form 10-IFA', submitted_by: 'Co-operative society opting for Section 115BAE', purpose: 'Exercise option u/s 115BAE for concessional 15% tax rate', irrevocable: true },
      { form: 'Form 10-IB',  submitted_by: 'Domestic company opting for Section 115BA (25%)', purpose: 'Exercise option u/s 115BA', deadline: 'On or before ITR due date' },
      { form: 'Form 10-IC',  submitted_by: 'Domestic company opting for Section 115BAA (22%)', purpose: 'Exercise option u/s 115BAA', deadline: 'On or before ITR due date' },
      { form: 'Form 10-ID',  submitted_by: 'New manufacturing domestic company opting for Section 115BAB (15%)', purpose: 'Exercise option u/s 115BAB', deadline: 'On or before ITR due date' },
      { form: 'Form 3CA-3CD', submitted_by: 'Taxpayer requiring mandatory audit under ANOTHER law AND u/s 44AB', purpose: 'Audit Report (3CA) + Statement of Particulars (3CD) u/s 44AB', deadline: 'At least 1 month before due date u/s 139(1)' },
      { form: 'Form 3CB-3CD', submitted_by: 'Taxpayer required to get accounts audited u/s 44AB (NOT under another law)', purpose: 'Audit Report (3CB) + Statement of Particulars (3CD) u/s 44AB', deadline: 'At least 1 month before due date u/s 139(1)' },
      { form: 'Form 3CEB',   section: '92E', submitted_by: 'Taxpayer entering into international or specified domestic transactions', purpose: "Chartered Accountant's report with details of all international / specified domestic transactions", deadline: 'At least 1 month before due date u/s 139(1)' },
      { form: 'Form 29B',    section: '115JB', submitted_by: 'Company subject to MAT', purpose: "Accountant's report certifying book profit computation u/s 115JB (MAT)", deadline: 'At least 1 month before due date u/s 139(1)' },
      { form: 'Form 29C',    section: '115JC', submitted_by: 'Non-company assessee subject to AMT', purpose: "Accountant's report for computing Adjusted Total Income and AMT u/s 115JC" },
      { form: 'Form 10-CCB', submitted_by: 'Taxpayer claiming deductions u/s 80-I(7) / 80-IA / 80-IB / 80-IC / 80-IE', purpose: 'Audit Report — mandatory for claiming these infrastructure/industrial deductions', deadline: 'At least 1 month before due date u/s 139(1)' },
      { form: 'Form 10B',    submitted_by: 'Charitable or religious trust / institution', purpose: 'Audit Report u/s 12A(1)(b) or u/s 10(23C)', use_when: ['Total income > ₹5 crores', 'Trust receives any foreign contribution', 'Trust uses income outside India'] },
      { form: 'Form 10BB',   submitted_by: 'Charitable or religious trust / institution', purpose: 'Audit Report for all other cases (where 10B is not applicable)' },
      { form: 'Form 10BD',   submitted_by: 'Charitable or religious trust', purpose: 'Statement of particulars of donations received during a FY', deadline: 'On or before 31st May of the FY immediately following' },
    ],
  },
]

// ── Main seed function ────────────────────────────────────────────────────────

export async function seedTaxMeta() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/conceptra')

  console.log('Seeding tax meta for AY 2026-27…')

  // 1. TdsSchedule — upsert by ref
  for (const doc of TAX_SLABS) {
    await TdsSchedule.findOneAndUpdate(
      { ref: doc.ref },
      { $set: doc },
      { upsert: true, new: true, runValidators: false }
    )
  }
  console.log(`✓ TdsSchedule: ${TAX_SLABS.length} docs`)

  // 2. TaxSurcharge — upsert by (tax_year, entity_class)
  for (const doc of SURCHARGE_DOCS) {
    await TaxSurcharge.findOneAndUpdate(
      { tax_year: doc.tax_year, entity_class: doc.entity_class },
      { $set: doc },
      { upsert: true, new: true, runValidators: false }
    )
  }
  console.log(`✓ TaxSurcharge: ${SURCHARGE_DOCS.length} docs`)

  // 3. TaxMetaYear — upsert by tax_year
  await TaxMetaYear.findOneAndUpdate(
    { tax_year: META_YEAR_DOC.tax_year },
    { $set: META_YEAR_DOC },
    { upsert: true, new: true, runValidators: false }
  )
  console.log('✓ TaxMetaYear: 1 doc')

  // 4. TaxDeduction — upsert by (tax_year, section)
  for (const doc of DEDUCTION_DOCS) {
    await TaxDeduction.findOneAndUpdate(
      { tax_year: doc.tax_year, section: doc.section },
      { $set: doc },
      { upsert: true, new: true, runValidators: false }
    )
  }
  console.log(`✓ TaxDeduction: ${DEDUCTION_DOCS.length} docs`)

  // 5. TaxReference — upsert by (tax_year, category)
  for (const doc of REFERENCE_DOCS) {
    await TaxReference.findOneAndUpdate(
      { tax_year: doc.tax_year, category: doc.category },
      { $set: doc },
      { upsert: true, new: true, runValidators: false }
    )
  }
  console.log(`✓ TaxReference: ${REFERENCE_DOCS.length} docs`)

  console.log('Seed complete.')
  await mongoose.disconnect()
}

if (require.main === module) {
  seedTaxMeta().catch(err => { console.error(err); process.exit(1) })
}
