export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.length === 10 && !value.trim().startsWith('+')) digits = '7' + digits
  return digits ? '+' + digits : ''
}

export function formatPhone(value: string): string {
  const phone = normalizePhone(value)
  if (!phone.startsWith('+7')) return phone
  if (phone.length > 12) return phone
  const d = phone.slice(2, 12)
  return '+7' + (d ? ' ' + d.slice(0, 3) : '') + (d.length > 3 ? ' ' + d.slice(3, 6) : '') + (d.length > 6 ? '-' + d.slice(6, 8) : '') + (d.length > 8 ? '-' + d.slice(8) : '')
}
