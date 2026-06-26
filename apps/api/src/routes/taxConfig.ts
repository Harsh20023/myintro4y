import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/authenticate'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin'
import { compileTaxConfig } from '../services/taxConfigCompiler'
import { TaxConfigCache } from '../models/TaxConfigCache'

const router = Router()

// POST /tax-config/sync?tax_year=2026-27  (superadmin)
router.post('/sync', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const taxYear = (req.query.tax_year as string) || '2026-27'
    const compiled = await compileTaxConfig(taxYear)

    await TaxConfigCache.findOneAndUpdate(
      { tax_year: taxYear },
      {
        $set: {
          tax_year:    taxYear,
          version:     compiled.version,
          compiled_at: new Date(compiled.compiled_at),
          data:        compiled,
        },
      },
      { upsert: true, new: true },
    )

    res.json({
      message:     'Tax config synced successfully',
      tax_year:    taxYear,
      version:     compiled.version,
      compiled_at: compiled.compiled_at,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? 'Sync failed' })
  }
})

// GET /tax-config/latest?tax_year=2026-27  (public)
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const taxYear = (req.query.tax_year as string) || '2026-27'
    const cache = await TaxConfigCache.findOne({ tax_year: taxYear }).lean()
    if (!cache) return res.status(404).json({ message: 'Not synced yet' })
    res.json(cache)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
