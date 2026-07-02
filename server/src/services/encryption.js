import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const MASTER_SECRET = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'escavio-encryption-2026'

function deriveKey(tenantId, landlordId, propertyId) {
  const seed = `${tenantId}:${landlordId}:${propertyId}:${MASTER_SECRET}`
  return crypto.createHash('sha256').update(seed).digest()
}

export function encrypt(text, tenantId, landlordId, propertyId) {
  const key = deriveKey(tenantId, landlordId, propertyId)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText, tenantId, landlordId, propertyId) {
  try {
    const key = deriveKey(tenantId, landlordId, propertyId)
    const [ivHex, tagHex, content] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(content, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return '[Unable to decrypt message]'
  }
}
