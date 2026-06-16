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
import ussdRoutes from './routes/ussd.js'
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
app.use('/api/ussd', ussdRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Escavio API', agent: 'Ama v1.0', timestamp: new Date().toISOString() })
})

app.get('/api/test-moolre', async (req, res) => {
  const moolre = (await import('./config/env.js')).default.moolre
  const base = moolre.baseUrl || 'https://sandbox.moolre.com'
  const ts = Date.now()
  const results = { baseUrl: base, user: moolre.apiUser }

  const headers = { 'Content-Type': 'application/json', 'X-API-USER': moolre.apiUser, 'X-API-PUBKEY': moolre.pubKey }
  const transferHeaders = { 'Content-Type': 'application/json', 'X-API-USER': moolre.apiUser, 'X-API-KEY': moolre.apiKey }
  const smsHeaders = { 'Content-Type': 'application/json', 'X-API-USER': moolre.apiUser, ...(moolre.vasKey ? { 'X-API-VASKEY': moolre.vasKey } : { 'X-API-KEY': moolre.apiKey }) }

  async function tryApi(name, url, hdrs, body) {
    try {
      const r = await fetch(url, { method: 'POST', headers: hdrs, body: JSON.stringify(body) })
      const text = await r.text()
      try { return { status: r.status, data: JSON.parse(text) } } catch { return { status: r.status, raw: text.slice(0, 300) } }
    } catch (err) { return { error: err.message } }
  }

  results.collection = await tryApi('Collection', `${base}/open/transact/payment`, headers, {
    type: 1, channel: 1, currency: 'GHS', payer: '233241234567', amount: '1', externalref: `TEST-COL-${ts}`,
  })

  results.disbursement = await tryApi('Disbursement', `${base}/open/transact/transfer`, transferHeaders, {
    type: 1, channel: 1, currency: 'GHS', amount: '1', receiver: '233241234567', externalref: `TEST-DIS-${ts}`,
  })

  const smsBody = { type: 1, senderid: 'Escavio', messages: [{ recipient: '233241234567', message: 'Escavio test SMS' }] }
  results.sms_vaskey = await tryApi('SMS-VASKEY', `${base}/open/sms/send`, smsHeaders, smsBody)
  if (results.sms_vaskey?.data?.code === 'APY00') {
    const smsAltHeaders = { 'Content-Type': 'application/json', 'X-API-USER': moolre.apiUser, 'X-API-KEY': moolre.apiKey }
    results.sms_apikey = await tryApi('SMS-APIKEY', `${base}/open/sms/send`, smsAltHeaders, smsBody)
  }

  results.ussd = { endpoint: '/api/ussd/callback', status: 'ready', note: 'Register callback URL in Moolre dashboard to activate' }

  res.json(results)
})

app.listen(env.port, () => {
  console.log(`Escavio server running on port ${env.port}`)
  startReminderSchedule()
})
