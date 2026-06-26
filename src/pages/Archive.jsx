import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/userId'
import { getDateIST } from '../lib/dateIST'

function SpeechBubble() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#ff5c00]"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Archive() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const today = getDateIST()
      const userId = getUserId()

      const { data: lyrics, error: lyricsError } = await supabase
        .from('lyrics')
        .select('id, date, lyric_text, song, artist')
        .eq('published', true)
        .lt('date', today)
        .order('date', { ascending: false })

      if (lyricsError) {
        setError('Could not load archive.')
        setLoading(false)
        return
      }

      if (!lyrics.length) {
        setLoading(false)
        return
      }

      const lyricIds = lyrics.map(l => l.id)

      const [{ data: allThoughts }, { data: userThoughts }] = await Promise.all([
        supabase.from('thoughts').select('lyric_id').in('lyric_id', lyricIds),
        supabase.from('thoughts').select('lyric_id').in('lyric_id', lyricIds).eq('user_id', userId),
      ])

      const countMap = {}
      for (const t of allThoughts ?? []) {
        countMap[t.lyric_id] = (countMap[t.lyric_id] ?? 0) + 1
      }
      const userPostedSet = new Set((userThoughts ?? []).map(t => t.lyric_id))

      setRows(lyrics.map(l => ({
        ...l,
        thoughtCount: countMap[l.id] ?? 0,
        userPosted: userPostedSet.has(l.id),
      })))
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <div className="min-h-screen bg-white" />

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 min-h-[calc(100vh-60px)] flex flex-col">
      <h2 className="text-lg font-bold text-[#0a0a0a] mb-8">Archive</h2>

      {error && <p className="text-sm text-[#0a0a0a]/40 mb-4">{error}</p>}

      {rows.length === 0 ? (
        <div>
          <p className="text-sm text-[#0a0a0a]">Nothing here yet.</p>
          <p className="text-sm text-[#0a0a0a]/40 mt-1">Past lyrics will collect here over time. Come back tomorrow.</p>
        </div>
      ) : (
        <div>
          {rows.map(item => (
            <div
              key={item.date}
              onClick={() => navigate(`/feed/${item.date}`)}
              className="flex items-center gap-4 py-4 border-b border-[#0a0a0a]/10 cursor-pointer hover:bg-[#0a0a0a]/[0.02] -mx-2 px-2 transition-colors"
            >
              <span className="text-sm text-[#0a0a0a]/40 w-24 shrink-0">{formatDate(item.date)}</span>
              <span className="text-sm text-[#0a0a0a] flex-1 truncate">{item.lyric_text}</span>
              <span className="text-xs text-[#0a0a0a]/40 shrink-0">{item.thoughtCount}</span>
              <div className="w-4 shrink-0 flex justify-center">
                {item.userPosted && <SpeechBubble />}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto pt-16 pb-8 text-center">
        <Link to="/about" className="font-sans text-base text-muted hover:text-ink transition-colors">
          wtf is this about?
        </Link>
      </div>
    </div>
  )
}
