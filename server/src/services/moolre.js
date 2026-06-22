import axios from 'axios'
import env from '../config/env.js'

const MOOLRE_BASE = env.moolre.baseUrl || 'https://api.moolre.com'
const ACCOUNT_NUMBER = env.moolre.accountNumber

const maskKey = (k) => k ? `${k.slice(0, 6)}...${k.slice(-4)} (${k.length} chars)` : 'MISSING'
console.log(`[Moolre] Config: baseUrl=${MOOLRE_BASE}, user=${env.moolre.apiUser || 'MISSING'}, acct=${ACCOUNT_NUMBER || 'MISSING'}`)
console.log(`[Moolre] Keys: apiKey=${maskKey(env.moolre.apiKey)}, pubKey=${maskKey(env.moolre.pubKey)}`)

const apiClient = axios.create({
  baseURL: MOOLRE_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-USER': env.moolre.apiUser,
    'X-API-KEY': env.moolre.apiKey,
  },
})

const pubClient = axios.create({
  baseURL: MOOLRE_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-USER': env.moolre.apiUser,
    'X-API-PUBKEY': env.moolre.pubKey,
  },
})

const smsClient = axios.create({
  baseURL: MOOLRE_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-USER': env.moolre.apiUser,
    ...(env.moolre.vasKey
      ? { 'X-API-VASKEY': env.moolre.vasKey }
      : { 'X-API-KEY': env.moolre.apiKey }),
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

export function detectChannel(phone) {
  const norm = normalizePhone(phone)
  const prefix = norm.slice(3, 5)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return { name: 'MTN', payCode: '13', transferCode: '1' }
  if (['20', '50'].includes(prefix)) return { name: 'Telecel', payCode: '6', transferCode: '6' }
  if (['26', '27', '56', '57'].includes(prefix)) return { name: 'AT', payCode: '7', transferCode: '7' }
  return { name: 'MTN', payCode: '13', transferCode: '1' }
}

function truncateError(data) {
  if (!data) return 'no response'
  const s = typeof data === 'string' ? data : JSON.stringify(data)
  if (s.includes('<html') || s.includes('<!DOCTYPE')) return `HTML error page (${s.length} chars)`
  return s.length > 200 ? s.slice(0, 200) + '...' : s
}

export async function collectPayment({ amount, phone, reference, callbackUrl }) {
  const norm = normalizePhone(phone)
  const channel = detectChannel(norm)

  console.log(`[Moolre] Collection: GHS ${amount} from ${norm} via ${channel.name} (${channel.payCode}), ref: ${reference}`)

  const payload = {
    type: 1,
    channel: channel.payCode,
    currency: 'GHS',
    payer: norm,
    amount: String(amount),
    externalref: reference,
    accountnumber: ACCOUNT_NUMBER,
  }

  if (callbackUrl) {
    payload.callbackurl = callbackUrl
  }

  try {
    const { data } = await apiClient.post('/open/transact/payment', payload)
    console.log(`[Moolre] Collection response:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Collection failed:`, err.response?.status, truncateError(err.response?.data || err.message))
    throw err
  }
}

export async function verifyPaymentOTP({ reference, otpcode, phone, amount }) {
  const norm = normalizePhone(phone)
  const channel = detectChannel(norm)

  console.log(`[Moolre] OTP verify: ref=${reference}, phone=${norm}, otp=${otpcode?.slice(0, 2)}****`)

  const payload = {
    type: 1,
    channel: channel.payCode,
    currency: 'GHS',
    payer: norm,
    externalref: reference,
    otpcode: String(otpcode),
    accountnumber: ACCOUNT_NUMBER,
  }

  if (amount) payload.amount = String(amount)

  try {
    const { data } = await apiClient.post('/open/transact/payment', payload)
    console.log(`[Moolre] OTP verify response:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] OTP verify failed:`, err.response?.status, truncateError(err.response?.data || err.message))
    throw err
  }
}

export async function validateName({ phone }) {
  const norm = normalizePhone(phone)
  const channel = detectChannel(norm)

  try {
    const { data } = await apiClient.post('/open/transact/validate', {
      type: 1,
      channel: channel.transferCode,
      currency: 'GHS',
      receiver: norm,
      accountnumber: ACCOUNT_NUMBER,
    })
    console.log(`[Moolre] Name validation for ${norm}:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Name validation failed:`, err.response?.status, truncateError(err.response?.data || err.message))
    return null
  }
}

export async function disbursePayment({ amount, phone, reference }) {
  const norm = normalizePhone(phone)
  const channel = detectChannel(norm)

  console.log(`[Moolre] Transfer: GHS ${amount} to ${norm} via ${channel.name} (${channel.transferCode}), ref: ${reference}`)

  try {
    const { data } = await apiClient.post('/open/transact/transfer', {
      type: 1,
      channel: channel.transferCode,
      currency: 'GHS',
      amount: String(amount),
      receiver: norm,
      externalref: reference,
      accountnumber: ACCOUNT_NUMBER,
    })
    console.log(`[Moolre] Transfer response:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Transfer failed:`, err.response?.status, truncateError(err.response?.data || err.message))
    throw err
  }
}

export async function checkPaymentStatus(reference) {
  try {
    const { data } = await pubClient.post('/open/transact/status', {
      type: 1,
      idtype: '1',
      id: reference,
      accountnumber: ACCOUNT_NUMBER,
    })
    console.log(`[Moolre] Payment status for ${reference}:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Payment status check failed:`, err.response?.status, truncateError(err.response?.data))
    return null
  }
}

export async function checkTransferStatus(reference) {
  try {
    const { data } = await apiClient.post('/open/transact/status', {
      type: 1,
      idtype: '1',
      id: reference,
      accountnumber: ACCOUNT_NUMBER,
    })
    console.log(`[Moolre] Transfer status for ${reference}:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Transfer status check failed:`, err.response?.status, truncateError(err.response?.data))
    return null
  }
}

export function parseTxStatus(txstatus) {
  if (txstatus === 1 || txstatus === '1') return 'success'
  if (txstatus === 2 || txstatus === '2') return 'failed'
  if (txstatus === 0 || txstatus === '0') return 'pending'
  if (txstatus === 3 || txstatus === '3') return 'unknown'
  const s = String(txstatus).toLowerCase()
  if (['success', 'completed', 'successful'].includes(s)) return 'success'
  if (['failed', 'declined', 'rejected'].includes(s)) return 'failed'
  return 'pending'
}

export async function createPaymentId({ phone, name, amount }) {
  const norm = normalizePhone(phone)

  const payload = {
    type: 2,
    phone: norm,
    name: name || 'Customer',
    currency: 'GHS',
    accountnumber: ACCOUNT_NUMBER,
  }
  if (amount) payload.amount = String(amount)

  try {
    const { data } = await pubClient.post('/open/account/create', payload)
    console.log(`[Moolre] Payment ID created for ${norm}:`, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`[Moolre] Payment ID creation failed:`, err.response?.status, err.response?.data || err.message)
    throw err
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
    console.error(`[Moolre] SMS failed:`, err.response?.status, truncateError(err.response?.data || err.message))
    throw err
  }
}

export async function checkAccountStatus() {
  try {
    const { data } = await apiClient.post('/open/account/status', {
      type: 1,
      accountnumber: ACCOUNT_NUMBER,
    })
    return data
  } catch (err) {
    console.error(`[Moolre] Account status failed:`, err.response?.status, truncateError(err.response?.data))
    return null
  }
}

export function verifyWebhookSecret(payload, expectedSecret) {
  const payloadSecret = payload?.data?.secret
  if (!payloadSecret || !expectedSecret) return false
  return payloadSecret === expectedSecret
}
