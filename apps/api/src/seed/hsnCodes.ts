/**
 * Seed HSN & SAC codes from the Excel master file.
 *
 * Setup:
 *   1. Place the Excel at:  apps/api/data/hsn_sac_master.xlsx
 *   2. Install xlsx:        npm install xlsx  (run from apps/api)
 *   3. Run:                 npx ts-node src/seed/hsnCodes.ts
 *
 * Expected sheets:
 *   HSN_MSTR  →  columns: HSN_CD, HSN_Description
 *   SAC_MSTR  →  columns: SAC_CD, SAC_Description
 *
 * Re-run safe: uses upsert. Enrichment fields (currentRate, taxDetails, deletedAt)
 * are only set on first insert — re-seeding won't wipe admin-entered rates.
 */

import 'dotenv/config'
import path from 'path'
import mongoose from 'mongoose'
import * as XLSX from 'xlsx'
import { HsnCode } from '../models/HsnCode'
import { HsnChapter } from '../models/HsnChapter'

const EXCEL_PATH = path.resolve(__dirname, '../../data/hsn_sac_master.xlsx')

// 8-digit → parent is 6-digit, 6 → 4, 4 → 2, 2 → null
function deriveParentCode(code: string): string | null {
  return code.length > 2 ? code.slice(0, code.length - 2) : null
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface RawHsnRow { HSN_CD: string | number; HSN_Description: string }
interface RawSacRow { SAC_CD: string | number; SAC_Description: string }

async function processRows(
  rows: Array<{ code: string; description: string }>,
  type: 'HSN' | 'SAC',
): Promise<{ codes: number; chapters: number }> {
  let codes = 0
  let chapters = 0

  for (const { code, description } of rows) {
    if (!code || !description) continue

    const chapterNumber = code.slice(0, 2)
    const parentCode    = deriveParentCode(code)

    // All entries (including 2-digit chapters) go into HsnCode
    await HsnCode.findOneAndUpdate(
      { hsnCode: code },
      {
        $set: {
          // Always refresh from master
          hsnCode:       code,
          type,
          description,
          chapterNumber,
          parentCode,
        },
        $setOnInsert: {
          // Only on first insert — admins manage these via API
          currentRate:              null,
          currentRateEffectiveDate: null,
          taxDetails:               [],
          active:                   true,
          deletedAt:                null,
          sourceId:                 null,
          lastSyncedAt:             null,
        },
      },
      { upsert: true, runValidators: false }
    )
    codes++

    // 2-digit entries also seed HsnChapter (for SEO pages / richer metadata)
    if (code.length === 2) {
      await HsnChapter.findOneAndUpdate(
        { chapterNumber: code },
        {
          $set: {
            chapterNumber,
            chapterName: description,
            type,
          },
          $setOnInsert: {
            slug:        toSlug(description),
            description: '',
            active:      true,
          },
        },
        { upsert: true, runValidators: false }
      )
      chapters++
    }
  }

  return { codes, chapters }
}

async function seedHsnCodes() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/conceptra')
  console.log('Connected to MongoDB. Reading Excel…')

  const wb = XLSX.readFile(EXCEL_PATH)

  // ── HSN_MSTR ────────────────────────────────────────────────────────────────
  const hsnSheet = wb.Sheets['HSN_MSTR']
  if (!hsnSheet) throw new Error('Sheet "HSN_MSTR" not found in the Excel file')

  const hsnRows = XLSX.utils.sheet_to_json<RawHsnRow>(hsnSheet).map(r => ({
    code:        String(r.HSN_CD ?? '').trim(),
    description: String(r.HSN_Description ?? '').trim(),
  }))
  console.log(`HSN rows found: ${hsnRows.length}`)

  const hsnResult = await processRows(hsnRows, 'HSN')
  console.log(`✓ HSN  — codes: ${hsnResult.codes} | chapters: ${hsnResult.chapters}`)

  // ── SAC_MSTR ────────────────────────────────────────────────────────────────
  const sacSheet = wb.Sheets['SAC_MSTR']
  if (!sacSheet) throw new Error('Sheet "SAC_MSTR" not found in the Excel file')

  const sacRows = XLSX.utils.sheet_to_json<RawSacRow>(sacSheet).map(r => ({
    code:        String(r.SAC_CD ?? '').trim(),
    description: String(r.SAC_Description ?? '').trim(),
  }))
  console.log(`SAC rows found: ${sacRows.length}`)

  const sacResult = await processRows(sacRows, 'SAC')
  console.log(`✓ SAC  — codes: ${sacResult.codes} | chapters: ${sacResult.chapters}`)

  console.log('\nSeed complete.')
  await mongoose.disconnect()
}

if (require.main === module) {
  seedHsnCodes().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
