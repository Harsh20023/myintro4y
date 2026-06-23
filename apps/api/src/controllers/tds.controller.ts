import { Request, Response } from 'express'
import { TdsCode } from '../models/TdsCode'
import { TdsCodeYear } from '../models/TdsCodeYear'
import { TdsSchedule } from '../models/TdsSchedule'

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000
}

// ─── codes ────────────────────────────────────────────────────────────────────

export const CodesController = {

  async list(_req: Request, res: Response) {
    try {
      const codes = await TdsCode.find().sort({ code: 1 })
      return res.json(codes)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await TdsCode.findOne({ code: req.params.code })
      if (!doc) return res.status(404).json({ message: 'Code not found' })
      return res.json(doc)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TdsCode.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDuplicateKeyError(err)) return res.status(409).json({ message: 'Code already exists' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const doc = await TdsCode.findOneAndUpdate(
        { code: req.params.code },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Code not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const doc = await TdsCode.findOneAndDelete({ code: req.params.code })
      if (!doc) return res.status(404).json({ message: 'Code not found' })
      return res.json({ message: 'Deleted' })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}

// ─── code_years ───────────────────────────────────────────────────────────────

export const CodeYearsController = {

  async list(req: Request, res: Response) {
    try {
      const filter: Record<string, string> = {}
      if (req.query.code)     filter.code     = String(req.query.code)
      if (req.query.tax_year) filter.tax_year = String(req.query.tax_year)
      const docs = await TdsCodeYear.find(filter).sort({ code: 1, tax_year: -1 })
      return res.json(docs)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await TdsCodeYear.findById(req.params.id)
      if (!doc) return res.status(404).json({ message: 'Record not found' })
      return res.json(doc)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TdsCodeYear.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return res.status(409).json({ message: 'A record for this code + tax_year already exists' })
      }
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const doc = await TdsCodeYear.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Record not found' })
      return res.json(doc)
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return res.status(409).json({ message: 'A record for this code + tax_year already exists' })
      }
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const doc = await TdsCodeYear.findByIdAndDelete(req.params.id)
      if (!doc) return res.status(404).json({ message: 'Record not found' })
      return res.json({ message: 'Deleted' })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}

// ─── schedules ────────────────────────────────────────────────────────────────

export const SchedulesController = {

  async list(req: Request, res: Response) {
    try {
      const filter: Record<string, string> = {}
      if (req.query.kind)     filter.kind     = String(req.query.kind)
      if (req.query.tax_year) filter.tax_year = String(req.query.tax_year)
      if (req.query.regime)   filter.regime   = String(req.query.regime)
      const docs = await TdsSchedule.find(filter).sort({ tax_year: -1, ref: 1 })
      return res.json(docs)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await TdsSchedule.findOne({ ref: req.params.ref })
      if (!doc) return res.status(404).json({ message: 'Schedule not found' })
      return res.json(doc)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await TdsSchedule.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDuplicateKeyError(err)) return res.status(409).json({ message: 'Schedule ref already exists' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const doc = await TdsSchedule.findOneAndUpdate(
        { ref: req.params.ref },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Schedule not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const doc = await TdsSchedule.findOneAndDelete({ ref: req.params.ref })
      if (!doc) return res.status(404).json({ message: 'Schedule not found' })
      return res.json({ message: 'Deleted' })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}
