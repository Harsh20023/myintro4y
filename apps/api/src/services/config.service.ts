import { SystemConfig } from '../models/SystemConfig'

const TOOLS_KEY = 'tools_require_login'

export const ConfigService = {
  async getToolsAccess(): Promise<boolean> {
    const config = await SystemConfig.findOne({ key: TOOLS_KEY })
    return Boolean(config?.value ?? false)
  },

  async setToolsAccess(requireLogin: boolean): Promise<boolean> {
    await SystemConfig.findOneAndUpdate(
      { key: TOOLS_KEY },
      { key: TOOLS_KEY, value: requireLogin },
      { upsert: true, new: true }
    )
    return requireLogin
  },
}
