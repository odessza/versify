import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './_adminAuth.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data, error } = await supabase
    .from('lyrics')
    .select('*')
    .order('date', { ascending: false })
    .limit(90)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ lyrics: data })
}
