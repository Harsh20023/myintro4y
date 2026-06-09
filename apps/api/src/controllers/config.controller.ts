import { Request, Response } from 'express'
import { ConfigService } from '../services/config.service'

export const ConfigController = {
  async getToolsAccess(_req: Request, res: Response) {
    try {
      const requireLogin = await ConfigService.getToolsAccess()
      return res.json({ requireLogin })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },

  async setToolsAccess(req: Request, res: Response) {
    try {
      const { requireLogin } = req.body as { requireLogin: boolean }
      if (typeof requireLogin !== 'boolean') {
        return res.status(400).json({ message: 'requireLogin must be a boolean' })
      }

      const result = await ConfigService.setToolsAccess(requireLogin)
      return res.json({ requireLogin: result })
    } catch {
      return res.status(500).json({ message: 'Server error' })
    }
  },
}
