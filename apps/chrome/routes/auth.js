const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

// In-memory OTP store: phone -> otp
const otpStore = {}

router.post('/request-otp', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'phone required' })

  const otp = '123456'
  otpStore[phone] = otp
  console.log(`[OTP] Phone: ${phone} | OTP: ${otp}`)

  res.json({ success: true })
})

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body
  if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' })

  if (otpStore[phone] !== String(otp)) {
    return res.status(401).json({ error: 'Invalid OTP' })
  }

  if (phone !== process.env.ADMIN_PHONE) {
    return res.status(403).json({ error: 'Unauthorized phone number' })
  }

  let admin = await Admin.findOne({ phone })
  if (!admin) admin = await Admin.create({ phone })

  delete otpStore[phone]

  const token = jwt.sign(
    { phone, adminId: admin._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({ token })
})

module.exports = router
