import express from 'express'
import cors from 'cors'
import env from './config/env.js'
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
import { startReminderSchedule } from './jobs/reminders.js'

const app = express()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Escavio API', agent: 'Ama v1.0', timestamp: new Date().toISOString() })
})

app.get('/api/test-moolre', async (req, res) => {
  const moolre = (await import('./config/env.js')).default.moolre
  const payload = { type: 1, channel: 1, currency: 'GHS', payer: '233241234567', amount: '1', externalref: 'TEST-' + Date.now() }
  try {
    const resp = await fetch(`${moolre.baseUrl || 'https://api.moolre.com'}/open/transact/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-USER': moolre.apiUser, 'X-API-PUBKEY': moolre.pubKey },
      body: JSON.stringify(payload),
    })
    const data = await resp.json()
    res.json({ httpStatus: resp.status, moolreResponse: data, sentUser: moolre.apiUser, pubKeyLen: moolre.pubKey?.length, pubKeyEnd: moolre.pubKey?.slice(-6) })
  } catch (err) {
    res.json({ error: err.message })
  }
})

app.listen(env.port, () => {
  console.log(`Escavio server running on port ${env.port}`)
  startReminderSchedule()
})
