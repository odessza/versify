import crypto from 'crypto'

function computeToken() {
  return crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update('shoegaze-admin-v1')
    .digest('hex')
}

export function generateToken() {
  return computeToken()
}

export function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = computeToken()
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
