import axios from 'axios'
import env from '../config/env.js'

const openrouter = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${env.openrouterKey}`,
    'Content-Type': 'application/json',
  },
})

async function chat(systemPrompt, userMessage) {
  const { data } = await openrouter.post('/chat/completions', {
    model: 'anthropic/claude-sonnet-4-20250514',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 500,
  })
  return data.choices[0].message.content
}

export async function summarizeLease(lease) {
  const system = `You are Escavio's AI assistant. Summarize lease terms in plain English that a market trader in Ghana can understand. Keep it to 3 sentences max. Use simple words. Mention the key financial details.`

  const user = `Lease details:
- Monthly rent: GHS ${lease.monthly_amount}
- Property: ${lease.properties?.address || 'N/A'}
- Period: ${lease.start_date} to ${lease.end_date}
- Advance months: ${lease.advance_months}
- Payout mode: ${lease.payout_mode}
- Escrow balance: GHS ${lease.escrow_balance}`

  return chat(system, user)
}

export async function analyzeDispute(dispute, payments) {
  const system = `You are Escavio's neutral AI mediator for rental disputes in Ghana. Analyze the dispute, suggest a fair resolution, and recommend whether escalation is needed. Be concise, fair, and reference the Ghana Rent Act 2026 where applicable.`

  const paymentHistory = payments
    .map(p => `${p.due_date}: GHS ${p.amount} - ${p.status}`)
    .join('\n')

  const user = `Dispute: ${dispute.description}

Payment history:
${paymentHistory || 'No payment records'}`

  return chat(system, user)
}

export async function generatePaymentReminder(tenant, amount, daysUntilDue, paymentHistory) {
  const system = `You are Escavio's SMS assistant. Generate a warm, culturally appropriate payment reminder SMS for a Ghanaian tenant. Keep it under 160 characters. Be respectful and encouraging, not threatening.`

  const paidCount = paymentHistory.filter(p => p.status === 'success').length
  const user = `Tenant: ${tenant.full_name}
Amount due: GHS ${amount}
Days until due: ${daysUntilDue}
Payments made so far: ${paidCount}`

  return chat(system, user)
}

export async function verifyGhanaCard(imageBase64, userProfile) {
  const system = `You are Escavio's KYC verification AI. You will receive an image of a Ghana Card (National ID). Extract the following information and return ONLY a valid JSON object with no additional text:

{
  "card_detected": true/false,
  "full_name": "name on card or null",
  "card_number": "GHA-XXXXXXXXX-X format or null",
  "date_of_birth": "DD/MM/YYYY or null",
  "gender": "M or F or null",
  "confidence": 0.0 to 1.0,
  "issues": ["list of any issues found"]
}

If the image is not a Ghana Card, set card_detected to false. Be strict about card authenticity.`

  const userMessage = [
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    },
    {
      type: 'text',
      text: `Verify this Ghana Card. The user claims their name is "${userProfile.full_name}" and card number is "${userProfile.ghana_card_number || 'not provided'}". Extract all details and verify.`,
    },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'anthropic/claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
    })

    const raw = data.choices[0].message.content
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { verified: false, reason: 'AI could not process the image' }

    const result = JSON.parse(jsonMatch[0])

    if (!result.card_detected) {
      return { verified: false, reason: 'No valid Ghana Card detected in image', extracted: result }
    }

    const nameMatch = result.full_name &&
      userProfile.full_name &&
      result.full_name.toLowerCase().includes(userProfile.full_name.split(' ')[0].toLowerCase())

    const cardMatch = !userProfile.ghana_card_number ||
      (result.card_number && result.card_number.replace(/\s/g, '') === userProfile.ghana_card_number.replace(/\s/g, ''))

    const verified = nameMatch && cardMatch && result.confidence >= 0.7

    return {
      verified,
      reason: verified
        ? 'Ghana Card verified successfully'
        : `Verification failed: ${!nameMatch ? 'Name mismatch. ' : ''}${!cardMatch ? 'Card number mismatch. ' : ''}${result.confidence < 0.7 ? 'Low confidence score.' : ''}`,
      extracted: result,
    }
  } catch (err) {
    return { verified: false, reason: 'Verification service temporarily unavailable' }
  }
}

export async function checkRentCompliance(advanceMonths) {
  if (advanceMonths > 6) {
    return {
      compliant: false,
      message: `Requesting ${advanceMonths} months advance violates the Ghana Rent Act 2026 which caps advances at 6 months. Please reduce to 6 months or fewer.`,
    }
  }
  return {
    compliant: true,
    message: 'This lease structure is compliant with the Ghana Rent Act 2026.',
  }
}
