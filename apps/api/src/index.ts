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
import tdsRoutes from './routes/tds'
import taxMetaRoutes from './routes/taxMeta'
import taxConfigRoutes from './routes/taxConfig'
import ruleSetsRoutes, { calculate } from './routes/ruleSets'
import servicesRoutes from './routes/services'

const app = express()
const PORT = process.env.PORT ?? 4000
const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  'http://localhost:3001',
]

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (curl, Postman) which send no origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(passport.initialize())

initPassport()

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/auth',   authRoutes)
app.use('/auth',   googleRoutes)
app.use('/config', configRoutes)
app.use('/gst',         gstRoutes)
app.use('/gst/returns', gstReturnsRoutes)
app.use('/tds',        tdsRoutes)
app.use('/tax-meta',   taxMetaRoutes)
app.use('/tax-config', taxConfigRoutes)
app.use('/rule-sets',  ruleSetsRoutes)
app.post('/calculate', calculate)
app.use('/services', servicesRoutes)

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})
