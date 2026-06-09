export function formatGHS(amount) {
  return `GHS ${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatPhone(phone) {
  if (!phone) return ''
  if (phone.startsWith('+233')) return phone
  if (phone.startsWith('0')) return `+233${phone.slice(1)}`
  return phone
}

export function daysUntil(date) {
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
