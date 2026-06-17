const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Device = require('../models/Device')

// Extension calls this on install/startup — no admin JWT needed, uses DEVICE_SECRET
router.post('/register', async (req, res) => {
  const { deviceId, chromeProfileName, browserInfo, registerKey } = req.body

  if (registerKey !== process.env.DEVICE_SECRET)
    return res.status(401).json({ error: 'Invalid register key' })

  if (!deviceId)
    return res.status(400).json({ error: 'deviceId required' })

  const ipAddress =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    ''

  const device = await Device.findOneAndUpdate(
    { deviceId },
    {
      $set: { chromeProfileName, browserInfo, ipAddress, lastSeen: new Date() },
      $setOnInsert: { firstSeen: new Date(), blocked: false },
    },
    { upsert: true, new: true }
  )

  if (device.blocked)
    return res.status(403).json({ error: 'device_blocked' })

  const token = jwt.sign(
    { deviceId, type: 'device' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )

  res.json({ token })
})

module.exports = router
