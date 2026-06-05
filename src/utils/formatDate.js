import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

const toDate = (value) => (typeof value === 'string' ? parseISO(value) : value)

export const formatDate = (value) => {
  if (!value) return '—'
  return format(toDate(value), 'dd MMM yyyy')
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  return format(toDate(value), 'dd MMM yyyy, HH:mm')
}

export const formatTime = (value) => {
  if (!value) return '—'
  return format(toDate(value), 'HH:mm')
}

export const formatRelative = (value) => {
  if (!value) return '—'
  const date = toDate(value)
  if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`
  if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`
  return formatDistanceToNow(date, { addSuffix: true })
}

export const formatDataSize = (mb) => {
  if (mb == null) return '—'
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  return `${mb} MB`
}
