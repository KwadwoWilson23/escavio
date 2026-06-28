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
    model: 'google/gemini-2.5-flash-lite',
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
- Officially called the "Ghana Card", issued by the National Identification Authority (NIA) of Ghana
- It is part of the ECOWAS National Biometric Identity Card system
- Standard credit-card size (85.6mm x 53.98mm), polycarbonate material

FRONT SIDE FEATURES (expect ALL of these on a valid card):
- Header text "ECOWAS IDENTITY CARD" — this is the STANDARD, CORRECT header on every valid Ghana Card
- ECOWAS logo (top left corner) — this is EXPECTED and REQUIRED, not suspicious
- "REPUBLIC OF GHANA" text
- Ghana flag (top right corner)
- Holder's photo (left side) with an embedded smart chip (gold chip)
- Surname / Nom
- Firstnames / Prénoms
- Previous Name(s) / Noms Précédents (if applicable)
- Nationality / Nationalité (e.g. "GHANAIAN")
- Sex / Sexe (M or F)
- Date of Birth / Date de Naissance
- Height / Taille (in meters)
- Personal ID Number format: GHA-XXXXXXXXX-X (always starts with "GHA-", 9 alphanumeric characters, a hyphen, and 1 check digit)
- Document Number (alphanumeric, e.g. BP9815979)
- Place of Issuance / Lieu de délivrance
- Date of Issuance / Date d'émission
- Date of Expiry / Date d'expiration

CRITICAL — DO NOT FLAG THESE AS ISSUES:
- "ECOWAS IDENTITY CARD" header is CORRECT and EXPECTED — do NOT treat it as suspicious
- ECOWAS logo is CORRECT and REQUIRED — do NOT flag its presence as an anomaly
- The absence of a standalone "NIA" logo on the card face is NORMAL — NIA is the issuing authority but does not print a separate logo on the front
- Bilingual French/English labels (Surname/Nom, Sex/Sexe) are STANDARD on the Ghana Card

YOUR TASK:
1. Determine if the image shows the FRONT of a real Ghana Card
2. Extract all readable text fields
3. Assess image quality (blur, glare, cropping, lighting)
4. Check ONLY for genuine fraud indicators: inconsistent fonts, visible digital editing, photo of a screen/photo, tampered text, missing core fields

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
  "has_ecowas_branding": true or false,
  "has_ghana_flag": true or false,
  "image_quality": "good" or "acceptable" or "poor",
  "image_issues": ["list of specific image quality problems"],
  "authenticity_score": 0.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "issues": ["list of GENUINE verification concerns only — never include ECOWAS branding"]
}

SCORING GUIDELINES:
- authenticity_score 0.9+: Card appears genuine with ECOWAS branding, photo, name, ID number, and dates all visible
- authenticity_score 0.7-0.9: Card appears genuine but some fields are unclear
- authenticity_score 0.5-0.7: Card has genuine concerns (tampered, cropped, or very blurry)
- authenticity_score below 0.5: Card appears fake, is a screenshot/photo-of-photo, or is not a Ghana Card
- confidence reflects how well you can read the text (1.0 = crystal clear, 0.5 = partially readable)
- ECOWAS branding should INCREASE the authenticity score, not decrease it`

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
      model: 'google/gemini-2.5-flash-lite',
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

    let isExpired = false
    if (result.expiry_date) {
      const parts = result.expiry_date.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
      if (parts) {
        const expiry = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]))
        isExpired = expiry < new Date()
      }
    }

    const authenticityOk = (result.authenticity_score || 0) >= 0.6
    const confidenceOk = (result.confidence || 0) >= 0.5

    const verified = nameMatch && cardMatch && authenticityOk && confidenceOk && !isExpired

    const reasons = []
    if (!nameMatch) reasons.push(`The name on your ID card "${result.full_name || 'unreadable'}" does not match your profile name "${userProfile.full_name}". Please update your profile name to match your Ghana Card exactly, then try again`)
    if (!cardMatch) reasons.push('Card number does not match your registered card number')
    if (!authenticityOk) reasons.push('Card authenticity could not be confirmed — please ensure you are uploading a real, physical Ghana Card and not a screenshot or photocopy')
    if (!confidenceOk) reasons.push('We could not read your card clearly. Please retake the photo in good lighting with the full card visible')
    if (!cardNumberValid && result.card_number) reasons.push('This does not appear to be a valid Ghana Card number format. Please ensure you are uploading a Ghana Card, not another document')
    if (isExpired) reasons.push(`Your Ghana Card has expired (${result.expiry_date}). Please upload a valid, unexpired card`)

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

export async function verifyGhanaCardBack(imageBase64, frontCardNumber) {
  const system = `You are Escavio's KYC verification AI specializing in Ghana Card (National ID) verification.

ABOUT THE GHANA CARD BACK SIDE:
- The back of the Ghana Card (ECOWAS National Biometric Identity Card) contains:
  - A Machine Readable Zone (MRZ) at the bottom — two or three lines of characters with << separators
  - The card number repeated in the MRZ
  - A barcode or QR code
  - The holder's signature
  - "NATIONAL IDENTIFICATION AUTHORITY" or NIA-related text (may vary)
  - May have a magnetic stripe at the top
  - ECOWAS branding may also appear on the back — this is NORMAL and EXPECTED
- The back does NOT have the holder's photo

YOUR TASK:
1. Determine if the image shows the BACK of a real Ghana Card
2. Check for the MRZ zone and try to read the card number from it
3. Assess image quality
4. Check for signs of tampering or forgery

Return ONLY a valid JSON object with no additional text or markdown:

{
  "card_detected": true or false,
  "is_back_side": true or false,
  "has_mrz": true or false,
  "mrz_card_number": "card number extracted from MRZ or null",
  "has_signature": true or false,
  "has_barcode": true or false,
  "image_quality": "good" or "acceptable" or "poor",
  "authenticity_score": 0.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "issues": ["list of any verification concerns"]
}

SCORING GUIDELINES:
- authenticity_score 0.9+: Back appears genuine with MRZ and expected elements
- authenticity_score 0.7-0.9: Back appears genuine but some elements unclear
- authenticity_score below 0.5: Not a Ghana Card back or appears fake`

  const userMessage = [
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    },
    {
      type: 'text',
      text: `Verify this is the BACK side of a Ghana Card. The front side card number is "${frontCardNumber}". Check if this back matches that card.`,
    },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 600,
    })

    const raw = data.choices[0].message.content
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { verified: false, reason: 'AI could not process the image. Please try with a clearer photo.' }

    const result = JSON.parse(jsonMatch[0])

    if (!result.card_detected) {
      return { verified: false, reason: 'No Ghana Card detected. Please upload a photo of the BACK side of your Ghana Card.', extracted: result }
    }

    if (!result.is_back_side) {
      return { verified: false, reason: 'This appears to be the front side. Please upload the BACK of your Ghana Card.', extracted: result }
    }

    if (result.image_quality === 'poor') {
      return { verified: false, reason: `Image quality is too low. ${(result.issues || []).join(', ')}. Please retake with better lighting.`, extracted: result }
    }

    const authenticityOk = (result.authenticity_score || 0) >= 0.6
    const hasMrz = result.has_mrz

    const mrzMatch = !result.mrz_card_number || !frontCardNumber ||
      result.mrz_card_number.replace(/[-\s]/g, '').toUpperCase().includes(frontCardNumber.replace(/[-\s]/g, '').toUpperCase().slice(4, 13))

    const verified = authenticityOk && hasMrz && mrzMatch

    const reasons = []
    if (!authenticityOk) reasons.push('Card back authenticity could not be confirmed')
    if (!hasMrz) reasons.push('Machine Readable Zone (MRZ) not detected on the back')
    if (!mrzMatch) reasons.push('Card number in MRZ does not match the front side')

    return {
      verified,
      reason: verified
        ? 'Ghana Card back verified successfully'
        : reasons.join('. ') + '.',
      extracted: result,
    }
  } catch (err) {
    console.error('[KYC Back] Error:', err.message, err.response?.status, err.response?.data?.error?.message || '')
    return { verified: false, reason: 'Verification service temporarily unavailable. Please try again.' }
  }
}

export async function verifyFaceMatch(cardBase64, selfieBase64, extractedName) {
  const system = `You are Escavio's face verification AI for KYC liveness and identity confirmation.

YOUR TASK:
1. Compare the passport photo on the Ghana Card (Image 1) with the selfie (Image 2)
2. Determine if they are the SAME PERSON
3. Check if the selfie shows a LIVE person (not a printed photo, screen display, or mask)

LIVENESS INDICATORS (real person):
- Natural skin texture with pores and color variation
- Realistic lighting with natural shadows on face
- Slight natural facial asymmetry
- Background looks like a real environment (room, wall, etc.)
- Natural depth of field
- No flat uniform lighting

FAKE INDICATORS (reject these):
- Moire patterns or screen pixels visible (photo of a screen)
- Paper edges, glossy reflections, or creases (printed photo)
- Face appears perfectly flat with no depth cues
- Unnatural color cast from screen backlight
- Visible frame or border around the face
- Another phone/device screen visible holding a photo

FACE COMPARISON:
- Account for aging differences (card photo may be older)
- Account for slight weight changes
- Focus on bone structure: forehead shape, nose bridge, jaw line, eye spacing
- Hair style changes are normal and should not affect matching
- Glasses on/off is normal

Return ONLY a valid JSON object:

{
  "faces_match": true or false,
  "match_confidence": 0.0 to 1.0,
  "is_live_person": true or false,
  "liveness_confidence": 0.0 to 1.0,
  "liveness_issues": [],
  "comparison_notes": "brief explanation"
}`

  const userMessage = [
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${cardBase64}` },
    },
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${selfieBase64}` },
    },
    {
      type: 'text',
      text: `Image 1 is the front of a Ghana Card for "${extractedName}". Image 2 is a selfie taken just now by the person claiming to own this card. Compare the face on the card with the selfie and check that the selfie is a live person.`,
    },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
    })

    const raw = data.choices[0].message.content
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { passed: false, reason: 'Face verification could not be completed. Please try again.' }

    const result = JSON.parse(jsonMatch[0])

    const facesMatch = result.faces_match && (result.match_confidence || 0) >= 0.55
    const isLive = result.is_live_person && (result.liveness_confidence || 0) >= 0.55
    const passed = facesMatch && isLive

    const reasons = []
    if (!facesMatch) reasons.push('The selfie does not match the photo on your Ghana Card')
    if (!isLive) reasons.push(`Liveness check failed: ${(result.liveness_issues || []).join(', ') || 'Could not confirm a live person'}`)

    return {
      passed,
      reason: passed ? 'Face and liveness verified successfully' : reasons.join('. ') + '.',
      details: result,
    }
  } catch (err) {
    console.error('[KYC Face] Error:', err.message, err.response?.status, err.response?.data?.error?.message || '')
    return { passed: false, reason: 'Face verification service temporarily unavailable. Please try again.' }
  }
}

export async function verifyPropertyDocument(imageBase64, docType, propertyInfo) {
  const docDescriptions = {
    land_title: 'Land Title Certificate issued by the Lands Commission of Ghana',
    indenture: 'Indenture (deed of conveyance) for property in Ghana',
    site_plan: 'Site Plan showing the plot boundaries and survey details',
    property_tax: 'Property tax receipt or assessment from the Metropolitan/Municipal Assembly',
    building_permit: 'Building/Development Permit from the local assembly',
    lease_agreement: 'Lease agreement or tenancy contract',
  }

  const docDesc = docDescriptions[docType] || 'Property ownership or authorization document'

  const system = `You are Escavio's property document verification AI for the Ghanaian real estate market.

DOCUMENT TYPE EXPECTED: ${docDesc}

YOUR TASK:
1. Determine if the image shows a valid ${docDesc}
2. Extract key information from the document
3. Assess document quality and authenticity
4. Check for signs of tampering or forgery

GHANA PROPERTY DOCUMENTS:
- Land Title Certificate: Issued by Lands Commission, contains plot number, registration number, owner name, location details, official stamps and signatures
- Indenture: Legal document transferring land ownership, contains grantor/grantee names, land description, consideration amount, witness signatures, commissioner for oaths stamp
- Site Plan: Contains survey details, plot dimensions, coordinates, surveyor's stamp, scale information
- Property Tax Receipt: Contains assessment number, property ID, owner name, assessment amount, payment period, assembly stamp
- Building Permit: Contains permit number, building plans reference, owner name, plot details, approval stamps

Return ONLY a valid JSON object:

{
  "document_detected": true or false,
  "document_type_match": true or false,
  "detected_type": "what type of document this appears to be",
  "owner_name": "extracted owner/grantee name or null",
  "property_location": "extracted property location or null",
  "plot_number": "extracted plot/parcel number or null",
  "registration_number": "extracted registration number or null",
  "date_issued": "extracted date or null",
  "has_official_stamp": true or false,
  "has_signatures": true or false,
  "image_quality": "good" or "acceptable" or "poor",
  "authenticity_score": 0.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "issues": ["list of concerns"],
  "extracted_details": "brief summary of all readable information"
}`

  const userMessage = [
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    },
    {
      type: 'text',
      text: `Verify this property document. Expected type: ${docDesc}. Property address: "${propertyInfo?.address || 'Not provided'}". Region: "${propertyInfo?.region || 'Not provided'}". Extract all readable information and assess authenticity.`,
    },
  ]

  try {
    const { data } = await openrouter.post('/chat/completions', {
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 800,
    })

    const raw = data.choices[0].message.content
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { verified: false, reason: 'AI could not process the document. Please try with a clearer photo.' }

    const result = JSON.parse(jsonMatch[0])

    if (!result.document_detected) {
      return { verified: false, reason: 'No document detected in the image. Please upload a clear photo of your property document.', extracted: result }
    }

    if (result.image_quality === 'poor') {
      return { verified: false, reason: `Image quality is too low. Please retake the photo with better lighting and ensure the entire document is visible.`, extracted: result }
    }

    const authenticityOk = (result.authenticity_score || 0) >= 0.55
    const hasStamp = result.has_official_stamp
    const hasSigs = result.has_signatures
    const confidenceOk = (result.confidence || 0) >= 0.5

    const verified = authenticityOk && confidenceOk && (hasStamp || hasSigs)

    const reasons = []
    if (!authenticityOk) reasons.push('Document authenticity could not be confirmed')
    if (!hasStamp && !hasSigs) reasons.push('No official stamps or signatures detected')
    if (!confidenceOk) reasons.push('Image is too unclear to read document details')
    if (!result.document_type_match) reasons.push(`Document appears to be a ${result.detected_type || 'different type'} instead of ${docType.replace(/_/g, ' ')}`)

    return {
      verified,
      reason: verified
        ? 'Property document verified successfully'
        : reasons.join('. ') + '.',
      extracted: result,
    }
  } catch (err) {
    console.error('[Doc AI] Error:', err.message, err.response?.status, err.response?.data?.error?.message || '')
    return { verified: false, reason: 'Document verification service temporarily unavailable. Please try again.' }
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
