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

  const [draftsResult, scheduledResult] = await Promise.all([
    supabase.from('lyrics').select('*').eq('published', false).eq('approved', false).order('date', { ascending: true }),
    supabase.from('lyrics').select('*').eq('published', false).eq('approved', true).order('date', { ascending: true }),
  ])

  if (draftsResult.error) return res.status(500).json({ error: draftsResult.error.message })
  if (scheduledResult.error) return res.status(500).json({ error: scheduledResult.error.message })

  return res.status(200).json({ drafts: draftsResult.data, scheduled: scheduledResult.data })
}
