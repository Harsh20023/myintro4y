const router = require('express').Router()
const requireAuth = require('../middleware/auth')
const Credential = require('../models/Credential')
const Device = require('../models/Device')

// Extension calls this with the unlocked token from POST /api/auth/verify-totp
router.get('/', requireAuth, async (req, res) => {
  const { deviceId, type } = req.admin

  if (!deviceId)
    return res.status(403).json({ error: 'Not a device token' })

  // Plain device JWT means TOTP hasn't been entered yet
  if (type !== 'device-unlocked')
    return res.status(401).json({ error: 'totp_required' })

  const device = await Device.findOne({ deviceId })
  if (!device)
    return res.status(401).json({ error: 'device_not_found' })

  if (device.blocked)
    return res.status(401).json({ error: 'device_blocked' })

  await Device.updateOne({ deviceId }, { lastSeen: new Date() })

  const creds = await Credential.find().sort({ clientName: 1 })
  res.json(
    creds.map(c => ({
      id: c._id,
      clientName: c.clientName,
      gstin: c.gstin,
      siteUrl: c.siteUrl,
      encryptedUsername: c.encryptedUsername,
      usernameIv: c.usernameIv,
      usernameAuthTag: c.usernameAuthTag,
      encryptedPassword: c.encryptedPassword,
      passwordIv: c.passwordIv,
      passwordAuthTag: c.passwordAuthTag,
    }))
  )
})

module.exports = router
