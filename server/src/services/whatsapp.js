import axios from 'axios'
import env from '../config/env.js'
import { normalizePhone } from './moolre.js'

const client = axios.create({
  baseURL: env.moolre.baseUrl || 'https://api.moolre.com',
  headers: {
    'Content-Type': 'application/json',
    'X-API-VASKEY': env.moolre.vasKey,
  },
})

export async function sendMessage({ phone, message, ref }) {
  const norm = normalizePhone(phone)
  try {
    const { data } = await client.post('/open/whatsapp/send', {
      type: 'text',
      messages: [
        {
          recipient: norm,
          ref: ref || `wa-reply-${Date.now()}`,
          message,
        },
      ],
    })
    console.log(`[WhatsApp] Message sent to ${norm}:`, data?.code || data?.status)
    return data
  } catch (err) {
    console.error(`[WhatsApp] Send failed:`, err.response?.status, err.response?.data || err.message)
    throw err
  }
}

export async function sendTemplate({ phone, template, language, placeholders, ref }) {
  const norm = normalizePhone(phone)
  const { data } = await client.post('/open/whatsapp/send', {
    template_name: template,
    language: language || 'English (en)',
    messages: [
      {
        recipient: norm,
        ref: ref || `wa-${Date.now()}`,
        placeholders: placeholders || [],
      },
    ],
  })
  return data
}

export async function sendPaymentReminder({ phone, name, amount, property, daysUntilDue }) {
  return sendTemplate({
    phone,
    template: 'payment_reminder',
    placeholders: [name, `GHS ${amount}`, property, String(daysUntilDue)],
    ref: `rem-${phone}-${Date.now()}`,
  })
}

export async function sendOverdueNotice({ phone, name, amount, property, daysOverdue }) {
  return sendTemplate({
    phone,
    template: 'overdue_notice',
    placeholders: [name, `GHS ${amount}`, property, String(daysOverdue)],
    ref: `ovd-${phone}-${Date.now()}`,
  })
}

export async function sendPaymentReceipt({ phone, name, amount, property, reference }) {
  return sendTemplate({
    phone,
    template: 'payment_receipt',
    placeholders: [name, `GHS ${amount}`, property, reference],
    ref: `rcp-${phone}-${Date.now()}`,
  })
}

export async function sendLandlordAlert({ phone, name, tenantName, amount, property, daysOverdue }) {
  return sendTemplate({
    phone,
    template: 'landlord_tenant_overdue',
    placeholders: [name, tenantName, `GHS ${amount}`, property, String(daysOverdue)],
    ref: `lda-${phone}-${Date.now()}`,
  })
}

export async function sendDisbursementNotice({ phone, name, amount, property }) {
  return sendTemplate({
    phone,
    template: 'disbursement_sent',
    placeholders: [name, `GHS ${amount}`, property],
    ref: `dsb-${phone}-${Date.now()}`,
  })
}

export const TEMPLATES = {
  payment_reminder: {
    name: 'payment_reminder',
    text: 'Hi {{1}}, your rent of {{2}} for {{3}} is due in {{4}} days. Reply to this message for help.',
  },
  overdue_notice: {
    name: 'overdue_notice',
    text: 'Hi {{1}}, your rent of {{2}} for {{3}} is {{4}} days overdue. Please pay as soon as possible to avoid penalties.',
  },
  payment_receipt: {
    name: 'payment_receipt',
    text: 'Hi {{1}}, your payment of {{2}} for {{3}} has been received. Ref: {{4}}. Thank you!',
  },
  landlord_tenant_overdue: {
    name: 'landlord_tenant_overdue',
    text: 'Hi {{1}}, tenant {{2}} owes {{3}} for {{4}}. {{5}} days overdue.',
  },
  disbursement_sent: {
    name: 'disbursement_sent',
    text: 'Hi {{1}}, GHS {{2}} has been sent to your wallet for {{3}}.',
  },
}
