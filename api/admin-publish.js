import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './_adminAuth.js'
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

  const today = getDateIST()

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
      return res.status(200).json({ noop: true, message: 'No approved unpublished lyric for today' })
    }
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ lyric: data })
}
