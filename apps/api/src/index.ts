import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import passport from 'passport'
import { connectDB } from './config/db'
import { initPassport } from './config/passport'
import authRoutes from './routes/auth'
import googleRoutes from './routes/google'
import configRoutes from './routes/config'
import gstRoutes from './routes/gst'
import gstReturnsRoutes from './routes/gst-returns'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(passport.initialize())

initPassport()

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/auth',   authRoutes)
app.use('/auth',   googleRoutes)
app.use('/config', configRoutes)
app.use('/gst',         gstRoutes)
app.use('/gst/returns', gstReturnsRoutes)

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})
