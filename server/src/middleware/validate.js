const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s+()-]{7,20}$/
const GHANA_CARD_RE = /^GHA-[A-Z0-9]{9}-[A-Z0-9]$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email) && email.length <= 254
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && PHONE_RE.test(phone)
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128
}

export function isValidGhanaCard(cardNumber) {
  return typeof cardNumber === 'string' && GHANA_CARD_RE.test(cardNumber.trim())
}

export function isValidUUID(id) {
  return typeof id === 'string' && UUID_RE.test(id)
}

export function isValidRole(role) {
  return role === 'landlord' || role === 'tenant'
}

export function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.length <= 200
}

export function isValidAmount(amount) {
  return typeof amount === 'number' && isFinite(amount) && amount >= 1 && amount <= 1000000
}

export function isValidBase64Image(str) {
  if (typeof str !== 'string') return false
  const raw = str.replace(/^data:image\/\w+;base64,/, '')
  const sizeBytes = (raw.length * 3) / 4
  return sizeBytes > 1000 && sizeBytes < 10 * 1024 * 1024
}

export function isValidOTP(otp) {
  return typeof otp === 'string' && /^\d{4,6}$/.test(otp)
}

export function isValidDescription(desc) {
  return typeof desc === 'string' && desc.trim().length >= 5 && desc.length <= 2000
}
