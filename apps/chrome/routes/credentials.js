const router = require('express').Router()
const requireAuth = require('../middleware/auth')
const Credential = require('../models/Credential')

// Extension calls this — returns encrypted data; extension decrypts with shared key
router.get('/', requireAuth, async (_req, res) => {
  const creds = await Credential.find().sort({ clientName: 1 })
  res.json(
    creds.map(c => ({
      id: c._id,
      clientName: c.clientName,
      gstin: c.gstin,
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
