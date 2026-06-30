import { Request, Response } from 'express'
import { HsnCode } from '../models/HsnCode'
import { HsnChapter } from '../models/HsnChapter'

const ALLOWED_LIMITS = [200, 300, 500]

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000
}

// ─── codes ────────────────────────────────────────────────────────────────────

export const HsnController = {

  // GET /hsn?type=HSN&chapter=01&rate=18&q=animal&active=true&page=1&limit=200
  async list(req: Request, res: Response) {
    try {
      const { type, chapter, rate, q, active, includeDeleted, page, limit } = req.query

      const filter: Record<string, unknown> = {}

      if (includeDeleted !== 'true') filter.deletedAt = null
      if (type)              filter.type          = String(type).toUpperCase()
      if (chapter)           filter.chapterNumber = String(chapter)
      if (rate !== undefined && rate !== '') filter.currentRate = Number(rate)
      if (active !== undefined) filter.active = active === 'true'
      if (q)                 filter.$or = [
        { hsnCode:    { $regex: String(q), $options: 'i' } },
        { description: { $regex: String(q), $options: 'i' } },
      ]

      const pageNum  = Math.max(1, parseInt(String(page  ?? '1'),   10) || 1)
      const rawLimit = parseInt(String(limit ?? '200'), 10)
      const limitNum = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 200

      const [docs, total] = await Promise.all([
        HsnCode.find(filter)
          .sort({ hsnCode: 1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        HsnCode.countDocuments(filter),
      ])

      return res.json({
        data: docs,
        pagination: {
          page:  pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await HsnCode.findOne({ hsnCode: req.params.code })
      if (!doc) return res.status(404).json({ message: 'Code not found' })
      return res.json(doc)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  // GET /hsn/:code/children — direct children in the hierarchy
  async getChildren(req: Request, res: Response) {
    try {
      const docs = await HsnCode.find({
        parentCode: req.params.code,
        deletedAt:  null,
      }).sort({ hsnCode: 1 }).lean()
      return res.json(docs)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await HsnCode.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDuplicateKeyError(err)) return res.status(409).json({ message: 'Code already exists' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const doc = await HsnCode.findOneAndUpdate(
        { hsnCode: req.params.code },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Code not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  // Soft delete — sets deletedAt + active: false
  async softRemove(req: Request, res: Response) {
    try {
      const doc = await HsnCode.findOneAndUpdate(
        { hsnCode: req.params.code, deletedAt: null },
        { $set: { deletedAt: new Date(), active: false } },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Code not found or already deleted' })
      return res.json({ message: 'Deleted', doc })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  // POST /hsn/:code/restore
  async restore(req: Request, res: Response) {
    try {
      const doc = await HsnCode.findOneAndUpdate(
        { hsnCode: req.params.code },
        { $set: { deletedAt: null, active: true } },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Code not found' })
      return res.json(doc)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}

// ─── chapters ─────────────────────────────────────────────────────────────────

export const ChaptersController = {

  // GET /hsn/chapters?type=HSN
  async list(req: Request, res: Response) {
    try {
      const filter: Record<string, unknown> = {}
      if (req.query.type)   filter.type   = String(req.query.type).toUpperCase()
      if (req.query.active !== undefined) filter.active = req.query.active === 'true'
      const docs = await HsnChapter.find(filter).sort({ chapterNumber: 1 }).lean()
      return res.json(docs)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await HsnChapter.findOne({ chapterNumber: req.params.number })
      if (!doc) return res.status(404).json({ message: 'Chapter not found' })
      return res.json(doc)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const doc = await HsnChapter.create(req.body)
      return res.status(201).json(doc)
    } catch (err) {
      if (isDuplicateKeyError(err)) return res.status(409).json({ message: 'Chapter already exists' })
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const doc = await HsnChapter.findOneAndUpdate(
        { chapterNumber: req.params.number },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Chapter not found' })
      return res.json(doc)
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Bad request' })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const doc = await HsnChapter.findOneAndDelete({ chapterNumber: req.params.number })
      if (!doc) return res.status(404).json({ message: 'Chapter not found' })
      return res.json({ message: 'Deleted' })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}
