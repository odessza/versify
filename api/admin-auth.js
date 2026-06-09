import { generateToken } from './_adminAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body ?? {}
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password.' })
  }

  return res.status(200).json({ token: generateToken() })
}
