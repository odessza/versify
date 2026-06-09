import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('lyrics')
    .update({ published: true })
    .eq('date', today)
    .eq('approved', true)
    .eq('published', false)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(200).json({ message: 'No approved lyric to publish for today' })
    }
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ message: "Published today's lyric", lyric: data })
}
