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
    model: 'anthropic/claude-opus-4.6-fast',
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
  const system = `You are Escavio's KYC verification AI specializing in Ghana Card (National ID) verification.

ABOUT THE GHANA CARD:
- Issued by the National Identification Authority (NIA) of Ghana
- Standard credit-card size (85.6mm x 53.98mm), polycarbonate material
- Front side contains: holder's photo (left side), full name, date of birth, gender (M/F), nationality, card number in format GHA-XXXXXXXXX-X (where X is alphanumeric), issue and expiry dates
- Has the Ghana coat of arms, NIA logo, and "REPUBLIC OF GHANA" text at the top
- Background has security patterns and the Ghana flag colors (red, gold, green)
- The card number always starts with "GHA-" followed by 9 alphanumeric characters, a hyphen, and 1 check digit
- Modern cards have a chip on the front

YOUR TASK:
1. Determine if the image shows the FRONT of a real Ghana Card
2. Extract all readable text fields
3. Assess image quality (blur, glare, cropping, lighting)
4. Check for signs the card might be fake (wrong fonts, missing security elements, edited text, screen photo of a photo)

Return ONLY a valid JSON object with no additional text or markdown:

{
  "card_detected": true or false,
  "is_front_side": true or false,
  "full_name": "exact name on card or null",
  "card_number": "GHA-XXXXXXXXX-X or null",
  "date_of_birth": "DD/MM/YYYY or null",
  "gender": "M or F or null",
  "nationality": "text or null",
  "issue_date": "text or null",
  "expiry_date": "text or null",
  "has_photo": true or false,
  "has_coat_of_arms": true or false,
  "has_nia_logo": true or false,
  "image_quality": "good" or "acceptable" or "poor",
  "image_issues": ["list of specific image quality problems"],
  "authenticity_score": 0.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "issues": ["list of any verification concerns"]
}

SCORING GUIDELINES:
- authenticity_score 0.9+: Card appears genuine with all expected elements visible
- authenticity_score 0.7-0.9: Card appears genuine but some elements are unclear
- authenticity_score 0.5-0.7: Card has some concerning elements, may need manual review
- authenticity_score below 0.5: Card appears fake, is a screenshot, or is not a Ghana Card
- confidence reflects how well you can read the text (1.0 = crystal clear, 0.5 = partially readable)`

  const userMessage = [
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    },
    {
      type: 'text',
      text: `Verify this Ghana Card image for KYC purposes. The account holder's registered name is "${userProfile.full_name}"${userProfile.ghana_card_number ? ` and their registered card number is "${userProfile.ghana_card_number}"` : ''}. Extract all details from the card and assess its authenticity.`,
    },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'anthropic/claude-opus-4.6-fast',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 800,
    })

    const raw = data.choices[0].message.content
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { verified: false, reason: 'AI could not process the image. Please try with a clearer photo.' }

    const result = JSON.parse(jsonMatch[0])

    if (!result.card_detected) {
      return { verified: false, reason: 'No Ghana Card detected in the image. Please upload a photo of the front side of your Ghana Card.', extracted: result }
    }

    if (!result.is_front_side) {
      return { verified: false, reason: 'Please upload the FRONT side of your Ghana Card, not the back.', extracted: result }
    }

    if (result.image_quality === 'poor') {
      return { verified: false, reason: `Image quality is too low for verification. Issues: ${(result.image_issues || []).join(', ')}. Please retake the photo with better lighting.`, extracted: result }
    }

    const profileNames = userProfile.full_name?.toLowerCase().split(/\s+/).filter(n => n.length > 1) || []
    const cardNames = result.full_name?.toLowerCase().split(/\s+/).filter(n => n.length > 1) || []
    const matchingNames = profileNames.filter(pn => cardNames.some(cn => cn.includes(pn) || pn.includes(cn)))
    const nameMatch = matchingNames.length >= 1 && cardNames.length > 0

    const cardMatch = !userProfile.ghana_card_number ||
      (result.card_number && result.card_number.replace(/[-\s]/g, '').toUpperCase() === userProfile.ghana_card_number.replace(/[-\s]/g, '').toUpperCase())

    const cardNumberValid = result.card_number && /^GHA-[A-Z0-9]{9}-[A-Z0-9]$/i.test(result.card_number.trim())

    const authenticityOk = (result.authenticity_score || 0) >= 0.6
    const confidenceOk = (result.confidence || 0) >= 0.5

    const verified = nameMatch && cardMatch && authenticityOk && confidenceOk

    const reasons = []
    if (!nameMatch) reasons.push(`Name on card "${result.full_name || 'unreadable'}" does not match your profile name "${userProfile.full_name}"`)
    if (!cardMatch) reasons.push('Card number does not match your registered card number')
    if (!authenticityOk) reasons.push('Card authenticity could not be confirmed')
    if (!confidenceOk) reasons.push('Image is too unclear to read card details')
    if (!cardNumberValid && result.card_number) reasons.push('Card number format appears invalid')

    return {
      verified,
      reason: verified
        ? 'Ghana Card verified successfully'
        : reasons.join('. ') + '.',
      extracted: result,
    }
  } catch (err) {
    console.error('[KYC AI] Error:', err.message, err.response?.status, err.response?.data?.error?.message || '')
    return { verified: false, reason: 'Verification service temporarily unavailable. Please try again in a moment.' }
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
