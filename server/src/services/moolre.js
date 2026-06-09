import axios from 'axios'
import crypto from 'crypto'
import env from '../config/env.js'

const MOOLRE_BASE = env.moolre.baseUrl || 'https://api.moolre.com'

const paymentClient = axios.create({
  baseURL: MOOLRE_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-USER': env.moolre.apiUser,
    'X-API-PUBKEY': env.moolre.pubKey,
  },
})

const transferClient = axios.create({
  baseURL: MOOLRE_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-USER': env.moolre.apiUser,
    'X-API-KEY': env.moolre.apiKey,
  },
})

const smsClient = axios.create({
  baseURL: MOOLRE_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(env.moolre.vasKey
      ? { 'X-API-VASKEY': env.moolre.vasKey }
      : { 'X-API-USER': env.moolre.apiUser, 'X-API-KEY': env.moolre.apiKey }),
  },
})

export function normalizePhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return '233' + digits.slice(1)
  if (digits.length === 9) return '233' + digits
  return digits
}

function detectChannel(phone) {
  const norm = normalizePhone(phone)
  const prefix = norm.slice(3, 5)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return { name: 'MTN', code: 1 }
  if (['20', '50'].includes(prefix)) return { name: 'Telecel', code: 6 }
  if (['26', '27', '56', '57'].includes(prefix)) return { name: 'AT', code: 7 }
  return { name: 'MTN', code: 1 }
}

export async function collectPayment({ amount, phone, reference, callbackUrl }) {
  const norm = normalizePhone(phone)
  const channel = detectChannel(norm)

  console.log(`[Moolre] Collection: GHS ${amount} from ${norm} via ${channel.name} (${channel.code}), ref: ${reference}`)

  const payload = {
    type: 1,
    channel: channel.code,
    currency: 'GHS',
    payer: norm,
    amount: String(amount),
    externalref: reference,
  }

  if (callbackUrl) {
    payload.callbackurl = callbackUrl
  }

  try {
    const { data } = await paymentClient.post('/open/transact/payment', payload)
    console.log(`[Moolre] Collection response:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Collection failed:`, err.response?.status, err.response?.data || err.message)
    throw err
  }
}

export async function disbursePayment({ amount, phone, reference }) {
  const norm = normalizePhone(phone)
  const channel = detectChannel(norm)

  console.log(`[Moolre] Transfer: GHS ${amount} to ${norm} via ${channel.name} (${channel.code}), ref: ${reference}`)

  try {
    const { data } = await transferClient.post('/open/transact/transfer', {
      type: 1,
      channel: channel.code,
      currency: 'GHS',
      amount: String(amount),
      receiver: norm,
    })
    console.log(`[Moolre] Transfer response:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Transfer failed:`, err.response?.status, err.response?.data || err.message)
    throw err
  }
}

export async function checkTransactionStatus(reference) {
  try {
    const { data } = await paymentClient.get(`/open/transact/status/${reference}`)
    return data
  } catch (err) {
    console.error(`[Moolre] Status check failed:`, err.response?.status, err.response?.data || err.message)
    return null
  }
}

export async function sendSMS({ phone, message }) {
  const norm = normalizePhone(phone)

  try {
    const { data } = await smsClient.post('/open/sms/send', {
      type: 1,
      senderid: 'Escavio',
      messages: [
        { recipient: norm, message },
      ],
    })
    console.log(`[Moolre] SMS sent to ${norm}:`, data?.code || data?.status)
    return data
  } catch (err) {
    console.error(`[Moolre] SMS failed:`, err.response?.status, err.response?.data || err.message)
    throw err
  }
}

export function verifyWebhookSignature(payload, signature) {
  if (!env.moolre.webhookSecret || !signature) return false
  const expected = crypto
    .createHmac('sha256', env.moolre.webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex')
  return expected === signature
}
