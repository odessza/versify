import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function getUsedSongs() {
  const { data } = await supabase
    .from('lyrics')
    .select('song, artist')
  if (!data || data.length === 0) return ''
  const list = [...new Map(data.map(r => [`${r.artist}|${r.song}`, r])).values()]
    .map(r => `- ${r.artist} — ${r.song}`)
    .join('\n')
  return `\nDo NOT choose any of the following songs, as they have already been used:\n${list}\n`
}

async function getLyricFromGemini(usedSongsBlock) {
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
${usedSongsBlock}
Respond with only the JSON object, no markdown, no other text.`,
          }],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Gemini API error: ${err.error?.message ?? response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return JSON.parse(text)
}

async function getPlaceholderFromGemini(lyric, song, artist) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are writing placeholder text for a textarea on an anonymous journaling website. A visitor is about to write a short personal reflection in response to this lyric: '${lyric}' from '${song}' by '${artist}'. Write a single short placeholder sentence (under 10 words) that feels like a quiet, personal invitation — poetic but not precious, warm but not pushy. No quotes. No punctuation at the end. Return only the placeholder text, nothing else.`,
          }],
        }],
      }),
    },
  )
  if (!response.ok) return null
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
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

async function isDuplicateLyric(lyricText) {
  const { data } = await supabase
    .from('lyrics')
    .select('id')
    .eq('lyric_text', lyricText)
    .limit(1)
  return data && data.length > 0
}

export async function fetchAndInsertDraft(date) {
  const MAX_ATTEMPTS = 3
  const usedSongsBlock = await getUsedSongs()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { artist, song, lyric } = await getLyricFromGemini(usedSongsBlock)

    if (await isDuplicateLyric(lyric)) continue

    const [{ albumArtUrl, geniusUrl }, thoughtPlaceholder] = await Promise.all([
      getSongMetaFromGenius(artist, song),
      getPlaceholderFromGemini(lyric, song, artist),
    ])

    const { data, error } = await supabase
      .from('lyrics')
      .insert({
        date,
        lyric_text: lyric,
        song,
        artist,
        album_art_url: albumArtUrl,
        genius_url: geniusUrl,
        thought_placeholder: thoughtPlaceholder,
        published: false,
        approved: true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  throw new Error('Failed to generate a unique lyric after 3 attempts')
}
