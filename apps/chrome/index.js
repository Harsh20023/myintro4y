require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const credentialRoutes = require('./routes/credentials')
const deviceRoutes = require('./routes/devices')
const adminRoutes = require('./routes/admin')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', app: 'chrome-gst-manager' })
)

app.use('/api/auth', authRoutes)
app.use('/api/credentials', credentialRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/admin', adminRoutes)

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () =>
      console.log(`Chrome GST Manager running on http://localhost:${PORT}`)
    )
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
