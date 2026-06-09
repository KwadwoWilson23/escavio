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

function detectPaymentChannel(phone) {
  const cleaned = phone.replace(/\D/g, '')
  const prefix = cleaned.startsWith('233') ? cleaned.slice(3, 5) : cleaned.slice(1, 3)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return 'MTN'
  if (['20', '50'].includes(prefix)) return 'Telecel'
  if (['26', '27', '56', '57'].includes(prefix)) return 'AT'
  return 'MTN'
}

function detectTransferChannel(phone) {
  const cleaned = phone.replace(/\D/g, '')
  const prefix = cleaned.startsWith('233') ? cleaned.slice(3, 5) : cleaned.slice(1, 3)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return 1
  if (['20', '50'].includes(prefix)) return 6
  if (['26', '27', '56', '57'].includes(prefix)) return 7
  return 1
}

export async function collectPayment({ amount, phone, reference }) {
  const { data } = await paymentClient.post('/open/transact/payment', {
    type: 1,
    channel: detectPaymentChannel(phone),
    currency: 'GHS',
    payer: phone,
    amount: String(amount),
    externalref: reference,
  })
  return data
}

export async function disbursePayment({ amount, phone, reference }) {
  const { data } = await transferClient.post('/open/transact/transfer', {
    type: 1,
    channel: detectTransferChannel(phone),
    currency: 'GHS',
    amount: String(amount),
    receiver: phone,
  })
  return data
}

export async function sendSMS({ phone, message }) {
  const { data } = await smsClient.post('/open/sms/send', {
    type: 1,
    senderid: 'Escavio',
    messages: [
      { recipient: phone, message },
    ],
  })
  return data
}

export function verifyWebhookSignature(payload, signature) {
  const expected = crypto
    .createHmac('sha256', env.moolre.webhookSecret || '')
    .update(JSON.stringify(payload))
    .digest('hex')
  return expected === signature
}
