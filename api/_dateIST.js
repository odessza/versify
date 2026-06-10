const IST_OFFSET_MS = 330 * 60 * 1000 // UTC+5:30

// Returns YYYY-MM-DD for the IST date, offset by daysFromNow
export function getDateIST(daysFromNow = 0) {
  const ms = Date.now() + IST_OFFSET_MS + daysFromNow * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString().slice(0, 10)
}
