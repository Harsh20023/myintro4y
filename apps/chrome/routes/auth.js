const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { generateSecret, generateURI, verifySync } = require('otplib')
const QRCode = require('qrcode')
const rateLimit = require('express-rate-limit')
const requireAuth = require('../middleware/auth')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Admin login — username + password + TOTP code, single request
router.post('/login', loginLimiter, (req, res) => {
  const { username, password, totpCode } = req.body
  if (!username || !password || !totpCode)
    return res.status(400).json({ error: 'username, password, and authenticator code required' })

  const credentialsOk =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD

  const result = verifySync({ token: String(totpCode), secret: process.env.TOTP_SECRET })
  const totpOk = result?.valid === true

  if (!credentialsOk || !totpOk)
    return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { username, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token })
})

// Extension TOTP unlock — extension sends its device JWT + TOTP code
// Returns a 1-hour unlocked token the extension uses to fetch credentials
router.post('/verify-totp', loginLimiter, requireAuth, (req, res) => {
  const { totpCode } = req.body
  const { deviceId } = req.admin

  if (!deviceId)
    return res.status(403).json({ error: 'Not a device token' })

  if (!totpCode)
    return res.status(400).json({ error: 'totpCode required' })

  const result = verifySync({ token: String(totpCode), secret: process.env.TOTP_SECRET })
  if (!result?.valid)
    return res.status(401).json({ error: 'Invalid authenticator code' })

  const token = jwt.sign(
    { deviceId, type: 'device-unlocked' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  res.json({ token, expiresIn: 3600 })
})

// One-time QR setup page — scan with Google Authenticator / Authy, then disable
// Set TOTP_SETUP_DISABLED=true in .env after scanning
router.get('/totp-setup', async (req, res) => {
  if (process.env.TOTP_SETUP_DISABLED === 'true')
    return res.status(404).send('Not found')

  const secret = process.env.TOTP_SECRET
  if (!secret)
    return res.status(500).send('TOTP_SECRET not set — run: node scripts/generate-totp-secret.js')

  const otpauth = generateURI({
    label: process.env.ADMIN_USERNAME || 'admin',
    issuer: 'Chrome GST Manager',
    secret,
  })

  const qrDataUrl = await QRCode.toDataURL(otpauth)

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>TOTP Setup — Chrome GST Manager</title>
  <style>
    body { font-family: monospace; background: #0f172a; color: #e2e8f0;
           display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 0; }
    h2 { color: #f8fafc; margin-bottom: 4px; }
    p  { color: #94a3b8; max-width: 360px; text-align: center; margin-bottom: 16px; }
    img { border: 6px solid #fff; border-radius: 12px; margin: 16px 0; }
    code { background: #1e293b; border: 1px solid #334155; padding: 10px 20px;
           border-radius: 8px; font-size: 15px; letter-spacing: 3px; }
    .warn { margin-top: 24px; color: #f59e0b; font-weight: bold; text-align: center; max-width: 420px; }
  </style>
</head>
<body>
  <h2>Scan with Google Authenticator or Authy</h2>
  <p>Open your authenticator app, tap "+" and scan this code.</p>
  <img src="${qrDataUrl}" width="220" height="220" />
  <p>Or enter the secret manually:</p>
  <code>${secret}</code>
  <p class="warn">After scanning, set <code>TOTP_SETUP_DISABLED=true</code> in .env and restart the server. Do not leave this route live.</p>
</body>
</html>`)
})

module.exports = router
