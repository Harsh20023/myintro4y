import { Request, Response } from 'express'
import { RuleSet } from '../models/RuleSet'
import { GstLateFeeService, type CalculateInput } from '../services/gstLateFee.service'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseEffectiveTo(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === '') return null
  return new Date(raw as string)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const RuleSetsController = {

  async list(req: Request, res: Response) {
    try {
      const query: Record<string, unknown> = { deletedAt: null }
      if (req.query.effectiveOn) {
        const d = new Date(req.query.effectiveOn as string)
        query.effectiveFrom = { $lte: d }
        query.$or = [{ effectiveTo: null }, { effectiveTo: { $gt: d } }]
      }
      const docs = await RuleSet.find(query).sort({ effectiveFrom: -1 })
      res.json(docs)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOne({ _id: req.params.id, deletedAt: null })
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { effectiveFrom, effectiveTo, lateFeeRules = [] } = req.body
      const from = new Date(effectiveFrom)
      const to   = parseEffectiveTo(effectiveTo)

      const overlap = await GstLateFeeService.checkOverlap(from, to, lateFeeRules)
      if (overlap) return res.status(409).json({ message: overlap })

      const doc = await RuleSet.create({ ...req.body, effectiveFrom: from, effectiveTo: to, deletedAt: null })
      res.status(201).json(doc)
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      res.status(e.code === 11000 ? 409 : 500).json({ message: e.message })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const existing = await RuleSet.findOne({ _id: req.params.id, deletedAt: null })
      if (!existing) return res.status(404).json({ message: 'Not found' })

      const from = req.body.effectiveFrom ? new Date(req.body.effectiveFrom) : existing.effectiveFrom
      const to   = 'effectiveTo' in req.body ? parseEffectiveTo(req.body.effectiveTo) : existing.effectiveTo
      const lateFeeRules = req.body.lateFeeRules ?? existing.lateFeeRules

      const overlap = await GstLateFeeService.checkOverlap(from, to, lateFeeRules, req.params.id)
      if (overlap) return res.status(409).json({ message: overlap })

      const doc = await RuleSet.findByIdAndUpdate(
        req.params.id,
        { ...req.body, effectiveFrom: from, effectiveTo: to },
        { new: true, runValidators: true }
      )
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  async softDelete(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json({ message: 'Deleted', id: doc._id })
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  // ── Sub-array: lateFeeRules ─────────────────────────────────────────────────

  async pushLateFeeRule(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $push: { lateFeeRules: req.body } },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  async pullLateFeeRule(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $pull: { lateFeeRules: { _id: req.params.ruleId } as unknown } },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  // ── Sub-array: interestRules ────────────────────────────────────────────────

  async pushInterestRule(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $push: { interestRules: req.body } },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  async pullInterestRule(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $pull: { interestRules: { _id: req.params.ruleId } as unknown } },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  // ── Sub-array: waivers ──────────────────────────────────────────────────────

  async pushWaiver(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $push: { waivers: req.body } },
        { new: true, runValidators: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },

  async pullWaiver(req: Request, res: Response) {
    try {
      const doc = await RuleSet.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $pull: { waivers: { _id: req.params.waiverId } as unknown } },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (err) {
      res.status(500).json({ message: (err as Error).message })
    }
  },
}

// ── Calculate endpoint ────────────────────────────────────────────────────────

export async function calculate(req: Request, res: Response) {
  try {
    const result = await GstLateFeeService.calculate(req.body as CalculateInput)
    res.json(result)
  } catch (err) {
    const msg = (err as Error).message
    const status = msg.includes('No rule set') || msg.includes('No late-fee') ? 404 : 400
    res.status(status).json({ message: msg })
  }
}
