import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function getLyricFromGemini() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a curator for a lyric-based anonymous journaling website. Each day, one song lyric is shown to all visitors as a writing prompt.

Select a well-known song with deeply personal, introspective lyrics. Return ONLY a JSON object with these exact fields:
- artist: the artist or band name (string)
- song: the song title (string)
- lyric: 1-2 consecutive lines from the song that are evocative, universal, and would inspire personal reflection (string)

Rules:
- The lyric must be a real, verbatim excerpt from the song
- Prefer emotionally resonant, poetic lines — not obvious repeated chorus hooks
- Avoid explicit content
- Choose from a wide range of genres and eras
- The lyric should work as a standalone reflection prompt without requiring knowledge of the song

Respond with only the JSON object, no markdown, no other text.`,
          }],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Gemini error ${response.status}: ${err.error?.message}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return JSON.parse(text)
}

async function getSongMetaFromGenius(artist, song) {
  const query = encodeURIComponent(`${artist} ${song}`)
  const response = await fetch(
    `https://api.genius.com/search?q=${query}`,
    { headers: { Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` } },
  )

  if (!response.ok) return { albumArtUrl: null, geniusUrl: null }

  const data = await response.json()
  const hit = data.response?.hits?.[0]?.result
  if (!hit) return { albumArtUrl: null, geniusUrl: null }

  return {
    albumArtUrl: hit.song_art_image_thumbnail_url ?? hit.header_image_thumbnail_url ?? null,
    geniusUrl: hit.url ?? null,
  }
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const date = tomorrow.toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('lyrics')
    .select('id')
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ message: 'Lyric already exists for tomorrow', date })
  }

  let lyricData
  try {
    lyricData = await getLyricFromGemini()
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }

  const { artist, song, lyric } = lyricData
  const { albumArtUrl, geniusUrl } = await getSongMetaFromGenius(artist, song)

  const { data, error } = await supabase
    .from('lyrics')
    .insert({
      date,
      lyric_text: lyric,
      song,
      artist,
      album_art_url: albumArtUrl,
      genius_url: geniusUrl,
      published: false,
      approved: false,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ message: 'Draft lyric created', lyric: data })
}
