import { Response } from 'express'
import { AuthRequest } from '../middleware/authenticate'
import { ServiceCategory } from '../models/ServiceCategory'
import { Service } from '../models/Service'
import { ServicePage } from '../models/ServicePage'

export const ServicesController = {

  // ── PUBLIC ─────────────────────────────────────────────────────────────────

  async getCategories(_req: AuthRequest, res: Response) {
    try {
      const categories = await ServiceCategory.find({ isVisible: true }).sort({ displayOrder: 1 })
      const services   = await Service.find({ isActive: true }).sort({ displayOrder: 1 }).select('-__v')

      const result = categories.map(cat => ({
        ...cat.toObject(),
        services: services.filter(s => s.categoryId.toString() === cat._id.toString()),
      }))
      return res.json(result)
    } catch (err) {
      console.error('[getCategories]', err)
      return res.status(500).json({ message: 'Server error', detail: (err as Error).message })
    }
  },

  async getServiceBySlug(req: AuthRequest, res: Response) {
    try {
      const service = await Service
        .findOne({ slug: req.params.slug, isActive: true })
        .populate('categoryId', 'name slug')
      if (!service) return res.status(404).json({ message: 'Service not found' })

      const page = await ServicePage.findOne({ serviceId: service._id })
      return res.json({ service, page: page ?? null })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  // ── CATEGORY ADMIN ─────────────────────────────────────────────────────────

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name, slug, icon, displayOrder, isVisible } = req.body
      if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' })

      const category = await ServiceCategory.create({ name, slug, icon, displayOrder, isVisible })
      return res.status(201).json(category)
    } catch (err: any) {
      if (err.code === 11000) return res.status(409).json({ message: 'Slug already exists' })
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const category = await ServiceCategory.findByIdAndUpdate(
        req.params.categoryId,
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!category) return res.status(404).json({ message: 'Category not found' })
      return res.json(category)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const category = await ServiceCategory.findByIdAndDelete(req.params.categoryId)
      if (!category) return res.status(404).json({ message: 'Category not found' })
      return res.json({ message: 'Category deleted' })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  // ── SERVICE ADMIN ──────────────────────────────────────────────────────────

  async createService(req: AuthRequest, res: Response) {
    try {
      const { categoryId, name, slug, shortDescription, icon, displayOrder, isActive, metaTitle, metaDescription } = req.body
      if (!categoryId || !name || !slug) {
        return res.status(400).json({ message: 'categoryId, name and slug are required' })
      }

      const service = await Service.create({ categoryId, name, slug, shortDescription, icon, displayOrder, isActive, metaTitle, metaDescription })
      return res.status(201).json(service)
    } catch (err: any) {
      if (err.code === 11000) return res.status(409).json({ message: 'Slug already exists' })
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async updateService(req: AuthRequest, res: Response) {
    try {
      const service = await Service.findByIdAndUpdate(
        req.params.serviceId,
        { $set: req.body },
        { new: true, runValidators: true }
      )
      if (!service) return res.status(404).json({ message: 'Service not found' })
      return res.json(service)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async deleteService(req: AuthRequest, res: Response) {
    try {
      const service = await Service.findByIdAndDelete(req.params.serviceId)
      if (!service) return res.status(404).json({ message: 'Service not found' })
      return res.json({ message: 'Service deleted' })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  // ── PAGE ADMIN ─────────────────────────────────────────────────────────────

  async upsertPage(req: AuthRequest, res: Response) {
    try {
      const { serviceId } = req.params
      const { heroTitle, heroSubtitle, heroCTAText, overviewText, eligibilityText } = req.body

      const page = await ServicePage.findOneAndUpdate(
        { serviceId },
        { $set: { heroTitle, heroSubtitle, heroCTAText, overviewText, eligibilityText } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
      return res.json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async addSection(req: AuthRequest, res: Response) {
    try {
      const { serviceId } = req.params
      const { type, heading, displayOrder, isVisible } = req.body
      if (!type || !heading) return res.status(400).json({ message: 'type and heading are required' })

      const page = await ServicePage.findOneAndUpdate(
        { serviceId },
        { $push: { sections: { type, heading, displayOrder, isVisible, blocks: [] } } },
        { new: true, upsert: true }
      )
      return res.status(201).json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async updateSection(req: AuthRequest, res: Response) {
    try {
      const { serviceId, sectionId } = req.params
      const { type, heading, displayOrder, isVisible } = req.body

      const updates: Record<string, unknown> = {}
      if (type         !== undefined) updates['sections.$.type']         = type
      if (heading      !== undefined) updates['sections.$.heading']      = heading
      if (displayOrder !== undefined) updates['sections.$.displayOrder'] = displayOrder
      if (isVisible    !== undefined) updates['sections.$.isVisible']    = isVisible

      const page = await ServicePage.findOneAndUpdate(
        { serviceId, 'sections._id': sectionId },
        { $set: updates },
        { new: true }
      )
      if (!page) return res.status(404).json({ message: 'Page or section not found' })
      return res.json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async deleteSection(req: AuthRequest, res: Response) {
    try {
      const { serviceId, sectionId } = req.params
      const page = await ServicePage.findOneAndUpdate(
        { serviceId },
        { $pull: { sections: { _id: sectionId } } },
        { new: true }
      )
      if (!page) return res.status(404).json({ message: 'Page not found' })
      return res.json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async addBlock(req: AuthRequest, res: Response) {
    try {
      const { serviceId, sectionId } = req.params
      const { type, title, body, icon, displayOrder, metadata } = req.body
      if (!type) return res.status(400).json({ message: 'type is required' })

      const page = await ServicePage.findOneAndUpdate(
        { serviceId, 'sections._id': sectionId },
        { $push: { 'sections.$.blocks': { type, title, body, icon, displayOrder, metadata } } },
        { new: true }
      )
      if (!page) return res.status(404).json({ message: 'Page or section not found' })
      return res.status(201).json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async updateBlock(req: AuthRequest, res: Response) {
    try {
      const { serviceId, sectionId, blockId } = req.params
      const { type, title, body, icon, displayOrder, metadata } = req.body

      const updates: Record<string, unknown> = {}
      if (type         !== undefined) updates['sections.$[sec].blocks.$[blk].type']         = type
      if (title        !== undefined) updates['sections.$[sec].blocks.$[blk].title']        = title
      if (body         !== undefined) updates['sections.$[sec].blocks.$[blk].body']         = body
      if (icon         !== undefined) updates['sections.$[sec].blocks.$[blk].icon']         = icon
      if (displayOrder !== undefined) updates['sections.$[sec].blocks.$[blk].displayOrder'] = displayOrder
      if (metadata     !== undefined) updates['sections.$[sec].blocks.$[blk].metadata']     = metadata

      const page = await ServicePage.findOneAndUpdate(
        { serviceId },
        { $set: updates },
        {
          new: true,
          arrayFilters: [{ 'sec._id': sectionId }, { 'blk._id': blockId }],
        }
      )
      if (!page) return res.status(404).json({ message: 'Page not found' })
      return res.json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async deleteBlock(req: AuthRequest, res: Response) {
    try {
      const { serviceId, sectionId, blockId } = req.params
      const page = await ServicePage.findOneAndUpdate(
        { serviceId, 'sections._id': sectionId },
        { $pull: { 'sections.$.blocks': { _id: blockId } } },
        { new: true }
      )
      if (!page) return res.status(404).json({ message: 'Page or section not found' })
      return res.json(page)
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}
