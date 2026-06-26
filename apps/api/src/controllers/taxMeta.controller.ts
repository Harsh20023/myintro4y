import { Request, Response } from 'express'
import { TaxSurcharge } from '../models/TaxSurcharge'
import { TaxMetaYear } from '../models/TaxMetaYear'
import { TaxDeduction } from '../models/TaxDeduction'
import { TaxReference } from '../models/TaxReference'

function isDupe(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000
}

// ── TaxSurcharge ──────────────────────────────────────────────────────────────

export const SurchargeController = {

  async list(req: Request, res: Response) {
    try {
      const filter: Record<string, string> = {}
      if (req.query.tax_year)    filter.tax_year    = String(req.query.tax_year)
      if (req.query.entity_class) filter.entity_class = String(req.query.entity_class)
      const docs = await TaxSurcharge.find(filter).sort({ tax_year: -1, entity_class: 1 })
      return res.json(docs)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async getOne(req: Request, res: Response) {
    try {
      const { tax_year, entity_class } = req.params
      const doc = await TaxSurcharge.findOne({ tax_year, entity_class })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TaxSurcharge.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDupe(err)) return res.status(409).json({ message: 'Entry already exists for this tax_year + entity_class' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { tax_year, entity_class } = req.params
      const doc = await TaxSurcharge.findOneAndUpdate(
        { tax_year, entity_class },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { tax_year, entity_class } = req.params
      const doc = await TaxSurcharge.findOneAndDelete({ tax_year, entity_class })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json({ message: 'Deleted' })
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },
}

// ── TaxMetaYear ───────────────────────────────────────────────────────────────

export const MetaYearController = {

  async list(_req: Request, res: Response) {
    try {
      const docs = await TaxMetaYear.find().sort({ tax_year: -1 })
      return res.json(docs)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await TaxMetaYear.findOne({ tax_year: req.params.tax_year })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TaxMetaYear.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDupe(err)) return res.status(409).json({ message: 'Meta for this tax_year already exists' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const doc = await TaxMetaYear.findOneAndUpdate(
        { tax_year: req.params.tax_year },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const doc = await TaxMetaYear.findOneAndDelete({ tax_year: req.params.tax_year })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json({ message: 'Deleted' })
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },
}

// ── TaxDeduction ──────────────────────────────────────────────────────────────

export const DeductionController = {

  async list(req: Request, res: Response) {
    try {
      const filter: Record<string, string> = {}
      if (req.query.tax_year) filter.tax_year = String(req.query.tax_year)
      if (req.query.regime)   filter.regime   = String(req.query.regime)
      const docs = await TaxDeduction.find(filter).sort({ tax_year: -1, section: 1 })
      return res.json(docs)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async getOne(req: Request, res: Response) {
    try {
      const { tax_year, section } = req.params
      const doc = await TaxDeduction.findOne({ tax_year, section })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TaxDeduction.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDupe(err)) return res.status(409).json({ message: 'Deduction already exists for this tax_year + section' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { tax_year, section } = req.params
      const doc = await TaxDeduction.findOneAndUpdate(
        { tax_year, section },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { tax_year, section } = req.params
      const doc = await TaxDeduction.findOneAndDelete({ tax_year, section })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json({ message: 'Deleted' })
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },
}

// ── TaxReference ──────────────────────────────────────────────────────────────

export const ReferenceController = {

  async list(req: Request, res: Response) {
    try {
      const filter: Record<string, string> = {}
      if (req.query.tax_year) filter.tax_year = String(req.query.tax_year)
      if (req.query.category) filter.category = String(req.query.category)
      const docs = await TaxReference.find(filter).sort({ tax_year: -1, category: 1 })
      return res.json(docs)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async getOne(req: Request, res: Response) {
    try {
      const { tax_year, category } = req.params
      const doc = await TaxReference.findOne({ tax_year, category })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TaxReference.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDupe(err)) return res.status(409).json({ message: 'Reference already exists for this tax_year + category' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { tax_year, category } = req.params
      const doc = await TaxReference.findOneAndUpdate(
        { tax_year, category },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { tax_year, category } = req.params
      const doc = await TaxReference.findOneAndDelete({ tax_year, category })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      return res.json({ message: 'Deleted' })
    } catch { return res.status(500).json({ message: 'Server error' }) }
  },
}
