import { createClient } from '@supabase/supabase-js'
import { fetchAndInsertDraft } from './_lyricPipeline.js'
import { getDateIST } from './_dateIST.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const date = getDateIST(1) // tomorrow in IST

  const { data: existing } = await supabase
    .from('lyrics')
    .select('id')
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ message: 'Lyric already exists for tomorrow', date })
  }

  try {
    const lyric = await fetchAndInsertDraft(date)
    return res.status(200).json({ message: 'Draft lyric created', lyric })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
