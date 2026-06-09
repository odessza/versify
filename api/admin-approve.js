import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './_adminAuth.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id, lyric_text } = req.body ?? {}
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const updates = { approved: true }
  if (lyric_text?.trim()) updates.lyric_text = lyric_text.trim()

  const { data, error } = await supabase
    .from('lyrics')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ lyric: data })
}
