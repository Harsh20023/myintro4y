const router = require('express').Router()
const requireAuth = require('../middleware/auth')
const Credential = require('../models/Credential')
const Device = require('../models/Device')
const { encrypt, decrypt } = require('../utils/crypto')

router.get('/devices', requireAuth, async (_req, res) => {
  const devices = await Device.find().sort({ lastSeen: -1 })
  res.json(devices)
})

router.post('/devices/:id/kick', requireAuth, async (req, res) => {
  const device = await Device.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true })
  if (!device) return res.status(404).json({ error: 'Device not found' })
  res.json({ success: true })
})

router.post('/devices/:id/restore', requireAuth, async (req, res) => {
  const device = await Device.findByIdAndUpdate(req.params.id, { blocked: false }, { new: true })
  if (!device) return res.status(404).json({ error: 'Device not found' })
  res.json({ success: true })
})

router.get('/credentials', requireAuth, async (_req, res) => {
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
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  )
})

router.post('/credentials', requireAuth, async (req, res) => {
  const { clientName, gstin, username, password } = req.body
  if (!clientName || !username || !password) {
    return res.status(400).json({ error: 'clientName, username, and password are required' })
  }

  const u = encrypt(username)
  const p = encrypt(password)

  const cred = await Credential.create({
    clientName,
    gstin: gstin || '',
    encryptedUsername: u.encrypted,
    usernameIv: u.iv,
    usernameAuthTag: u.authTag,
    encryptedPassword: p.encrypted,
    passwordIv: p.iv,
    passwordAuthTag: p.authTag,
  })

  res.status(201).json({ id: cred._id, clientName: cred.clientName })
})

router.post('/credentials/bulk', requireAuth, async (req, res) => {
  const { credentials } = req.body
  if (!Array.isArray(credentials) || credentials.length === 0)
    return res.status(400).json({ error: 'credentials array required' })

  let created = 0
  const errors = []

  for (const cred of credentials) {
    const { clientName, gstin, username, password } = cred
    if (!clientName || !username || !password) {
      errors.push({ clientName: clientName || '?', reason: 'Missing name, username, or password' })
      continue
    }
    try {
      const u = encrypt(username)
      const p = encrypt(password)
      await Credential.create({
        clientName,
        gstin: gstin || '',
        encryptedUsername: u.encrypted,
        usernameIv: u.iv,
        usernameAuthTag: u.authTag,
        encryptedPassword: p.encrypted,
        passwordIv: p.iv,
        passwordAuthTag: p.authTag,
      })
      created++
    } catch (err) {
      errors.push({ clientName, reason: err.message })
    }
  }

  res.json({ created, errors })
})

router.put('/credentials/:id', requireAuth, async (req, res) => {
  const { clientName, gstin, username, password } = req.body
  const update = {}

  if (clientName !== undefined) update.clientName = clientName
  if (gstin !== undefined) update.gstin = gstin

  if (username) {
    const u = encrypt(username)
    update.encryptedUsername = u.encrypted
    update.usernameIv = u.iv
    update.usernameAuthTag = u.authTag
  }
  if (password) {
    const p = encrypt(password)
    update.encryptedPassword = p.encrypted
    update.passwordIv = p.iv
    update.passwordAuthTag = p.authTag
  }

  const cred = await Credential.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!cred) return res.status(404).json({ error: 'Credential not found' })
  res.json({ success: true })
})

router.delete('/credentials/:id', requireAuth, async (req, res) => {
  const cred = await Credential.findByIdAndDelete(req.params.id)
  if (!cred) return res.status(404).json({ error: 'Credential not found' })
  res.json({ success: true })
})

module.exports = router
