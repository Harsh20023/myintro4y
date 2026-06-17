const router = require('express').Router()
const requireAuth = require('../middleware/auth')
const Device = require('../models/Device')

router.post('/register', requireAuth, async (req, res) => {
  const { deviceId, chromeProfileName, browserInfo } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  const ipAddress =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    ''

  await Device.findOneAndUpdate(
    { deviceId },
    {
      $set: { chromeProfileName, browserInfo, ipAddress, lastSeen: new Date() },
      $setOnInsert: { firstSeen: new Date() },
    },
    { upsert: true }
  )

  res.json({ success: true })
})

module.exports = router
