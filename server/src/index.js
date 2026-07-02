import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import env from './config/env.js'
import { sanitizeInputs } from './middleware/sanitize.js'
import authRoutes from './routes/auth.js'
import propertyRoutes from './routes/properties.js'
import leaseRoutes from './routes/leases.js'
import paymentRoutes from './routes/payments.js'
import webhookRoutes from './routes/webhooks.js'
import aiRoutes from './routes/ai.js'
import disputeRoutes from './routes/disputes.js'
import whatsappRoutes from './routes/whatsapp.js'
import notificationRoutes from './routes/notifications.js'
import kycRoutes from './routes/kyc.js'
import walletRoutes from './routes/wallet.js'
import conversationRoutes from './routes/conversations.js'
import reviewRoutes from './routes/reviews.js'
import communityRoutes from './routes/community.js'
import uploadRoutes from './routes/upload.js'
// import ussdRoutes from './routes/ussd.js'
import { startReminderSchedule } from './jobs/reminders.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://escavio.site',
    'https://www.escavio.site',
    'https://escavio.vercel.app',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
})

const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many verification attempts. Please try again in an hour.' },
})

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many payment requests. Please try again later.' },
})

app.use(globalLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(sanitizeInputs)

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/google', authLimiter)
app.use('/api/kyc', kycLimiter)
app.use('/api/payments', paymentLimiter)
app.use('/api/wallet/deposit', paymentLimiter)
app.use('/api/wallet/withdraw', paymentLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/leases', leaseRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/disputes', disputeRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/upload', uploadRoutes)
// app.use('/api/ussd', ussdRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Escavio API', agent: 'Ama v1.0', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(env.port, () => {
  console.log(`Escavio server running on port ${env.port}`)
  startReminderSchedule()
})
