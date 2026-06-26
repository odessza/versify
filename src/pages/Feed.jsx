import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/userId'
import { getDateIST } from '../lib/dateIST'

const PAGE_SIZE = 50

function avatarUrl(seed) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Feed() {
  const { date } = useParams()
  const userId = getUserId()
  const targetDate = date ?? getDateIST()

  const [lyric, setLyric] = useState(null)
  const [userHasPosted, setUserHasPosted] = useState(!!date)
  const [thoughts, setThoughts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadLyric() {
      setLoading(true)
      setPage(1)

      const { data, error: lyricError } = await supabase
        .from('lyrics')
        .select('*')
        .eq('date', targetDate)
        .eq('published', true)
        .single()

      if (lyricError) {
        setError('Could not load lyric.')
        setLoading(false)
        return
      }

      setLyric(data)

      if (!date) {
        const { count } = await supabase
          .from('thoughts')
          .select('*', { count: 'exact', head: true })
          .eq('lyric_id', data.id)
          .eq('user_id', userId)
        setUserHasPosted((count ?? 0) > 0)
      }

      setLoading(false)
    }

    loadLyric()
  }, [targetDate])

  useEffect(() => {
    if (!lyric) return

    async function loadThoughts() {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, count, error: thoughtsError } = await supabase
        .from('thoughts')
        .select('*', { count: 'exact' })
        .eq('lyric_id', lyric.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (thoughtsError) {
        setError('Could not load Thoughts.')
        return
      }

      setThoughts(data)
      setTotalCount(count ?? 0)
    }

    loadThoughts()
  }, [lyric, page])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  if (loading) return <div className="min-h-screen bg-white" />

  if (error || !lyric) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-sm text-[#0a0a0a]/40">{error ?? 'No lyric found for this day.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 min-h-[calc(100vh-60px)] flex flex-col">
      <div className="mb-8">
        <p className="text-xl font-bold text-[#0a0a0a] leading-snug mb-1">{lyric.lyric_text}</p>
        <p className="text-sm text-[#0a0a0a]/50">{lyric.song} — {lyric.artist}</p>
      </div>

      <hr className="border-[#0a0a0a]/10 mb-8" />

      {!userHasPosted && (
        <div className="mb-10">
          <p className="text-[#0a0a0a] mb-5">
            Aren't you nosy? Why don't you share a thought first before you have a look at others?
          </p>
          <Link
            to="/"
            className="inline-block bg-[#ff5c00] text-white text-sm font-medium px-5 py-2.5 hover:bg-[#e05200] transition-colors"
          >
            Share a Thought
          </Link>
        </div>
      )}

      {userHasPosted && (
        <>
          <p className="text-sm text-[#0a0a0a]/40 mb-6">
            {totalCount} {totalCount === 1 ? 'Thought' : 'Thoughts'}
          </p>

          {thoughts.length === 0 ? (
            <p className="text-sm text-[#0a0a0a]/40">No Thoughts yet.</p>
          ) : (
            <div className="space-y-6">
              {thoughts.map(t => (
                <div key={t.id} className="flex gap-4">
                  <img
                    src={avatarUrl(t.user_id)}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0 bg-[#0a0a0a]/5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-sm leading-relaxed mb-1">{t.content}</p>
                    <div className="flex items-center gap-2">
                      {t.user_id === userId && (
                        <span className="text-xs font-medium text-[#ff5c00]">You</span>
                      )}
                      <span className="text-xs text-[#0a0a0a]/30">{timeAgo(t.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#0a0a0a]/10">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="text-sm text-[#0a0a0a] disabled:text-[#0a0a0a]/30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-xs text-[#0a0a0a]/30">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="text-sm text-[#0a0a0a] disabled:text-[#0a0a0a]/30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
      <div className="mt-auto pt-16 pb-8 text-center">
        <Link to="/about" className="font-sans text-base text-muted hover:text-ink transition-colors">
          wtf is this about?
        </Link>
      </div>
    </div>
  )
}
