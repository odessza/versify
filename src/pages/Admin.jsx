import { useState, useEffect } from 'react'

const TOKEN_KEY = 'shoegaze_admin_token'

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function Admin() {
  const [token, setToken] = useState(null)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)

  const [drafts, setDrafts] = useState([])
  const [editedTexts, setEditedTexts] = useState({})
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [actionState, setActionState] = useState({})

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY)
    if (stored) {
      setToken(stored)
      loadDrafts(stored)
    }
  }, [])

  async function loadDrafts(t) {
    setDraftsLoading(true)
    const res = await fetch('/api/admin-lyrics', {
      headers: { Authorization: `Bearer ${t}` },
    })
    if (res.ok) {
      const data = await res.json()
      setDrafts(data)
      const texts = {}
      for (const d of data) texts[d.id] = d.lyric_text
      setEditedTexts(texts)
    }
    setDraftsLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      const { token: t } = await res.json()
      sessionStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      loadDrafts(t)
    } else {
      setAuthError('Wrong password.')
    }
    setAuthLoading(false)
  }

  async function handleApprove(draft) {
    setActionState(s => ({ ...s, [draft.id]: 'approving' }))
    const res = await fetch('/api/admin-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: draft.id, lyric_text: editedTexts[draft.id] }),
    })
    if (res.ok) {
      setActionState(s => ({ ...s, [draft.id]: 'approved' }))
    } else {
      setActionState(s => ({ ...s, [draft.id]: 'error' }))
    }
  }

  async function handleRegenerate(draft) {
    setActionState(s => ({ ...s, [draft.id]: 'regenerating' }))
    const res = await fetch('/api/admin-regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: draft.id }),
    })
    if (res.ok) {
      const { lyric } = await res.json()
      setDrafts(ds => ds.map(d => d.id === draft.id ? lyric : d))
      setEditedTexts(t => ({ ...t, [lyric.id]: lyric.lyric_text }))
      setActionState(s => {
        const next = { ...s }
        delete next[draft.id]
        return next
      })
    } else {
      setActionState(s => ({ ...s, [draft.id]: 'error' }))
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-xs px-6">
          <p className="text-sm font-bold tracking-widest uppercase text-[#0a0a0a] mb-8">Admin</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-[#0a0a0a]/15 p-3 text-sm text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 focus:outline-none focus:border-[#0a0a0a]/40 mb-3"
            />
            {authError && <p className="text-xs text-red-500 mb-3">{authError}</p>}
            <button
              type="submit"
              disabled={!password || authLoading}
              className="w-full bg-[#ff5c00] text-white text-sm font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e05200] transition-colors"
            >
              {authLoading ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h2 className="text-lg font-bold text-[#0a0a0a] mb-8">Pending drafts</h2>

      {draftsLoading && <p className="text-sm text-[#0a0a0a]/40">Loading…</p>}

      {!draftsLoading && drafts.length === 0 && (
        <p className="text-sm text-[#0a0a0a]/40">No pending drafts.</p>
      )}

      <div className="space-y-12">
        {drafts.map(draft => {
          const state = actionState[draft.id]

          if (state === 'approved') {
            return (
              <div key={draft.id}>
                <p className="text-sm text-[#0a0a0a]/40">
                  Approved. Will publish at midnight UTC.
                </p>
              </div>
            )
          }

          return (
            <div key={draft.id}>
              <p className="text-xs text-[#0a0a0a]/40 mb-4">{formatDate(draft.date)}</p>

              <textarea
                value={editedTexts[draft.id] ?? draft.lyric_text}
                onChange={e => setEditedTexts(t => ({ ...t, [draft.id]: e.target.value }))}
                rows={3}
                className="w-full text-[#0a0a0a] text-xl font-bold leading-snug border border-[#0a0a0a]/15 resize-none p-3 focus:outline-none focus:border-[#0a0a0a]/40 mb-3"
              />

              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-[#0a0a0a]/50">{draft.song} — {draft.artist}</p>
                {draft.album_art_url && (
                  <a
                    href={draft.genius_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 shrink-0 ml-4 block overflow-hidden"
                  >
                    <img src={draft.album_art_url} alt={draft.song} className="w-full h-full object-cover" />
                  </a>
                )}
              </div>

              {state === 'error' && (
                <p className="text-xs text-red-500 mb-3">Something went wrong. Try again.</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRegenerate(draft)}
                  disabled={state === 'regenerating' || state === 'approving'}
                  className="text-sm text-[#0a0a0a]/60 border border-[#0a0a0a]/15 px-4 py-2 hover:border-[#0a0a0a]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {state === 'regenerating' ? 'Regenerating…' : 'Regenerate'}
                </button>
                <button
                  onClick={() => handleApprove(draft)}
                  disabled={state === 'approving' || state === 'regenerating'}
                  className="text-sm bg-[#ff5c00] text-white font-medium px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e05200] transition-colors"
                >
                  {state === 'approving' ? 'Approving…' : 'Approve'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
