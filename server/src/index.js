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
// import ussdRoutes from './routes/ussd.js'
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
// app.use('/api/ussd', ussdRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Escavio API', agent: 'Ama v1.0', timestamp: new Date().toISOString() })
})

app.get('/api/test-moolre', async (req, res) => {
  const moolre = (await import('./config/env.js')).default.moolre
  const base = moolre.baseUrl || 'https://api.moolre.com'
  const ts = Date.now()
  const mask = (k) => k ? `${k.slice(0, 20)}...${k.slice(-10)} (${k.length}c)` : 'MISSING'
  const results = {
    baseUrl: base,
    user: moolre.apiUser,
    pubKey: mask(moolre.pubKey),
    apiKey: mask(moolre.apiKey),
  }

  const headers = { 'Content-Type': 'application/json', 'X-API-USER': moolre.apiUser, 'X-API-PUBKEY': moolre.pubKey }

  async function tryApi(url, hdrs, body) {
    try {
      const r = await fetch(url, { method: 'POST', headers: hdrs, body: JSON.stringify(body) })
      const text = await r.text()
      try { return { status: r.status, data: JSON.parse(text) } } catch { return { status: r.status, raw: text.slice(0, 300) } }
    } catch (err) { return { error: err.message } }
  }

  results.envKey = await tryApi(`${base}/open/transact/payment`, headers, {
    type: 1, channel: 13, currency: 'GHS', payer: '233504399802', amount: '1', externalref: `TEST-${ts}`,
  })

  res.json(results)
})

app.post('/api/test-moolre', async (req, res) => {
  const { user, pubkey } = req.body
  if (!user || !pubkey) return res.status(400).json({ error: 'Send { user, pubkey } in body' })

  const base = 'https://api.moolre.com'
  const ts = Date.now()
  const mask = (k) => `${k.slice(0, 20)}...${k.slice(-10)} (${k.length}c)`

  const headers = { 'Content-Type': 'application/json', 'X-API-USER': user.trim(), 'X-API-PUBKEY': pubkey.trim() }

  try {
    const r = await fetch(`${base}/open/transact/payment`, {
      method: 'POST', headers,
      body: JSON.stringify({ type: 1, channel: 13, currency: 'GHS', payer: '233504399802', amount: '1', externalref: `TEST-${ts}` }),
    })
    const text = await r.text()
    let data
    try { data = JSON.parse(text) } catch { data = text.slice(0, 300) }
    res.json({ user: user.trim(), pubkey: mask(pubkey.trim()), result: { status: r.status, data } })
  } catch (err) {
    res.json({ error: err.message })
  }
})

app.listen(env.port, () => {
  console.log(`Escavio server running on port ${env.port}`)
  startReminderSchedule()
})
