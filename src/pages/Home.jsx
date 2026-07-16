import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/userId'
import { getDateIST } from '../lib/dateIST'
import NowPlaying from '../components/NowPlaying'

const TODAY = getDateIST()

export default function Home() {
  const [lyric, setLyric] = useState(null)
  const [thoughtCount, setThoughtCount] = useState(0)
  const [thought, setThought] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleCount, setVisibleCount] = useState(0)

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

  useEffect(() => {
    if (!lyric) return

    const total = lyric.lyric_text.replace(/ \/ /g, ' ').split(' ').length + 1

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleCount(total)
      return
    }

    setVisibleCount(0)
    const timeouts = Array.from({ length: total }, (_, i) =>
      setTimeout(() => setVisibleCount(i + 1), 300 + i * 100)
    )
    return () => timeouts.forEach(clearTimeout)
  }, [lyric?.id])

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

  if (loading) return <div className="min-h-screen" />

  if (!lyric) {
    return (
      <main className="relative z-10 mx-auto max-w-[720px] px-7 pt-24 pb-56">
        <p className="font-sans text-sm text-muted">No lyric yet today. Check back soon.</p>
      </main>
    )
  }

  let gi = 0
  const indexedWordGrid = lyric.lyric_text.split(' / ').map(line =>
    line.split(' ').map(word => ({ word, idx: gi++ }))
  )
  const attrIdx = gi

  return (
    <>
      <main className="relative z-10 mx-auto max-w-[720px] px-7 pt-24 pb-8 min-h-[calc(100vh-60px)] flex flex-col">

        <div className="mb-0">
          <h1 className="font-display font-bold text-[clamp(34px,5.2vw,58px)] leading-[1.1] tracking-[-0.01em] text-ink">
            {indexedWordGrid.map((words, li) => (
              <span key={li} className="block">
                {words.map(({ word, idx }) => (
                  <Fragment key={idx}>
                    <span className="word">
                      <span className={`word-inner${idx < visibleCount ? ' visible' : ''}`}>
                        {word}
                      </span>
                    </span>
                    {' '}
                  </Fragment>
                ))}
              </span>
            ))}
          </h1>
          <p className="mt-6 font-sans font-medium text-sm text-muted">
            <span className="word">
              <span className={`word-inner${attrIdx < visibleCount ? ' visible' : ''}`}>
                {lyric.song} — {lyric.artist}
              </span>
            </span>
          </p>
        </div>

        <div className="h-px bg-line my-14" />

        {error && <p className="font-sans text-sm text-red-500 mb-4">{error}</p>}

        {submitted ? (
          <div>
            <p className="font-sans text-ink mb-6">Your Thought has been posted.</p>
            <div className="flex items-center gap-6">
              <button
                onClick={handleWriteAgain}
                className="font-sans text-sm text-muted hover:text-ink transition-colors"
              >
                Write again
              </button>
              <Link
                to="/feed"
                className="font-sans text-sm font-semibold text-orange hover:text-orange-dark transition-colors"
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
              placeholder={lyric.thought_placeholder || "No one's watching. What's on your mind?"}

              rows={5}
              maxLength={10000}
              className="w-full min-h-[170px] resize-y rounded-2xl border border-[#e3e3e3] bg-white/85 px-6 py-5 font-sans text-[17px] leading-relaxed text-ink outline-none placeholder:text-[#bdbdbd] transition focus:border-orange focus:ring-4 focus:ring-[rgba(249,116,58,0.12)]"
            />
            <div className="mt-5 flex items-center justify-between">
              <span className="font-sans text-sm text-muted">
                {thoughtCount >= 1 && `${thoughtCount} ${thoughtCount === 1 ? 'person has' : 'people have'} written today`}
              </span>
              <button
                type="submit"
                disabled={!thought.trim() || submitting}
                className="rounded-full bg-orange px-7 py-3.5 font-sans text-sm font-bold text-white shadow-[0_6px_18px_rgba(249,116,58,0.28)] transition hover:-translate-y-px hover:bg-orange-dark hover:shadow-[0_8px_22px_rgba(249,116,58,0.34)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_18px_rgba(249,116,58,0.28)]"
              >
                {submitting ? 'Posting…' : 'Post Thought'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-auto pt-16 pb-8 text-center">
          <Link to="/about" className="font-sans text-base text-muted hover:text-ink transition-colors">
            wtf is this about?
          </Link>
        </div>

      </main>

      <NowPlaying
        song={lyric.song}
        artist={lyric.artist}
        coverUrl={lyric.album_art_url}
        geniusUrl={lyric.genius_url}
      />
    </>
  )
}
