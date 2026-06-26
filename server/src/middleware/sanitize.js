const HTML_TAG_RE = /<\/?[^>]+(>|$)/g
const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi
const EVENT_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi

function stripXSS(str) {
  return str.replace(SCRIPT_RE, '').replace(EVENT_RE, '').replace(HTML_TAG_RE, '').trim()
}

function sanitizeValue(val) {
  if (typeof val === 'string') return stripXSS(val)
  if (Array.isArray(val)) return val.map(sanitizeValue)
  if (val && typeof val === 'object') return sanitizeObject(val)
  return val
}

function sanitizeObject(obj) {
  const clean = {}
  for (const [key, val] of Object.entries(obj)) {
    clean[key] = sanitizeValue(val)
  }
  return clean
}

export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query)
  }
  next()
}
