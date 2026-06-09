import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './_adminAuth.js'
import { fetchAndInsertDraft } from './_lyricPipeline.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.body ?? {}
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const { data: existing } = await supabase
    .from('lyrics')
    .select('date')
    .eq('id', id)
    .single()

  if (!existing) return res.status(404).json({ error: 'Draft not found' })

  await supabase.from('lyrics').delete().eq('id', id)

  try {
    const lyric = await fetchAndInsertDraft(existing.date)
    return res.status(200).json({ lyric })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
