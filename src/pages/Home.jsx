import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/userId'
import { getDateIST } from '../lib/dateIST'

const TODAY = getDateIST()

export default function Home() {
  const [lyric, setLyric] = useState(null)
  const [thoughtCount, setThoughtCount] = useState(0)
  const [thought, setThought] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error: lyricError } = await supabase
        .from('lyrics')
        .select('*')
        .eq('date', TODAY)
        .eq('published', true)
        .single()

      if (lyricError) {
        if (lyricError.code !== 'PGRST116') setError(lyricError.message)
        setLoading(false)
        return
      }

      setLyric(data)

      const { count } = await supabase
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('lyric_id', data.id)

      setThoughtCount(count ?? 0)
      setLoading(false)
    }

    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!thought.trim() || !lyric) return
    setSubmitting(true)

    const { error: insertError } = await supabase
      .from('thoughts')
      .insert({ lyric_id: lyric.id, user_id: getUserId(), content: thought.trim() })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  function handleWriteAgain() {
    setThought('')
    setSubmitted(false)
  }

  if (loading) return <div className="min-h-screen bg-white" />

  if (!lyric) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <p className="text-sm text-[#0a0a0a]/40">No lyric yet today. Check back soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-20">

        <div className="mb-12">
          <p className="text-4xl font-bold text-[#0a0a0a] leading-tight mb-5">
            {lyric.lyric_text}
          </p>
          <div className="flex items-end justify-between">
            <p className="text-sm text-[#0a0a0a]/50 tracking-wide">
              {lyric.song} — {lyric.artist}
            </p>
            {lyric.album_art_url && (
              <a
                href={lyric.genius_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 shrink-0 ml-4 block overflow-hidden"
              >
                <img
                  src={lyric.album_art_url}
                  alt={`${lyric.song} album art`}
                  className="w-full h-full object-cover"
                />
              </a>
            )}
          </div>
        </div>

        <hr className="border-[#0a0a0a]/10 mb-10" />

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {submitted ? (
          <div>
            <p className="text-[#0a0a0a] mb-6">Your Thought has been posted.</p>
            <div className="flex items-center gap-6">
              <button
                onClick={handleWriteAgain}
                className="text-sm text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors"
              >
                Write again
              </button>
              <Link
                to="/feed"
                className="text-sm font-medium text-[#ff5c00] hover:underline"
              >
                Read today's Thoughts →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={thought}
              onChange={e => setThought(e.target.value)}
              placeholder="Write your Thought…"
              rows={5}
              maxLength={10000}
              className="w-full text-[#0a0a0a] text-base placeholder:text-[#0a0a0a]/30 border border-[#0a0a0a]/15 resize-none p-4 focus:outline-none focus:border-[#0a0a0a]/40 mb-4"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#0a0a0a]/40">
                {thoughtCount >= 1 && `${thoughtCount} ${thoughtCount === 1 ? 'person has' : 'people have'} written today`}
              </span>
              <button
                type="submit"
                disabled={!thought.trim() || submitting}
                className="bg-[#ff5c00] text-white text-sm font-medium px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e05200] transition-colors"
              >
                {submitting ? 'Posting…' : 'Post Thought'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
