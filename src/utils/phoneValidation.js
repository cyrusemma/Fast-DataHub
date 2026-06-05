export function isValidGhanaPhone(phone) {
  if (!phone) return false
  const cleaned = phone.replace(/[\s\-()]/g, '')
  const n = cleaned.startsWith('+233')
    ? '0' + cleaned.slice(4)
    : cleaned.startsWith('233')
      ? '0' + cleaned.slice(3)
      : cleaned
  return /^0(2[0-9]|5[0-9])\d{7}$/.test(n)
}

export function normalizeGhanaPhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+233')) return '0' + cleaned.slice(4)
  if (cleaned.startsWith('233')) return '0' + cleaned.slice(3)
  return cleaned
}

// Best-effort network guess from a Ghanaian prefix (display hint only).
export function guessNetwork(phone) {
  const n = normalizeGhanaPhone(phone || '')
  const prefix = n.slice(0, 3)
  if (['024', '054', '055', '059', '025'].includes(prefix)) return 'MTN'
  if (['020', '050'].includes(prefix)) return 'TELECEL'
  if (['027', '057', '026', '056'].includes(prefix)) return 'AT'
  return null
}
