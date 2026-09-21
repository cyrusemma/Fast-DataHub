import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  return typeof value === 'string' ? parseISO(value) : new Date(value)
}

export const formatDate = (value) => {
  const date = toDate(value)
  if (!date || isNaN(date.getTime())) return '—'
  return format(date, 'dd MMM yyyy')
}

export const formatDateTime = (value) => {
  const date = toDate(value)
  if (!date || isNaN(date.getTime())) return '—'
  return format(date, 'dd MMM yyyy, HH:mm')
}

export const formatTime = (value, use12Hour = true) => {
  const date = toDate(value)
  if (!date || isNaN(date.getTime())) return '—'
  return format(date, use12Hour ? 'h:mm a' : 'HH:mm')
}

export const formatRelative = (value) => {
  const date = toDate(value)
  if (!date || isNaN(date.getTime())) return '—'
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`
  return formatDistanceToNow(date, { addSuffix: true })
}

export const formatDataSize = (mb) => {
  if (mb == null || isNaN(mb)) return '—'
  const num = Number(mb)
  if (num >= 1024) {
    const gb = num / 1024
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`
  }
  return `${num} MB`
}
