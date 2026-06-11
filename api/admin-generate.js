import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './_adminAuth.js'
import { fetchAndInsertDraft } from './_lyricPipeline.js'
import { getDateIST } from './_dateIST.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const date = getDateIST(1)

  const { data: existing } = await supabase
    .from('lyrics')
    .select('id')
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ exists: true })
  }

  try {
    const lyric = await fetchAndInsertDraft(date)
    return res.status(200).json({ lyric })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
