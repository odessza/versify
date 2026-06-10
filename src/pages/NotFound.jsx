import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-sm text-[#ff5c00] font-medium tracking-widest uppercase mb-4">404</p>
        <h1 className="text-4xl font-bold text-[#0a0a0a] leading-tight mb-6">
          This page doesn't exist.
        </h1>
        <Link to="/" className="text-sm font-medium text-[#0a0a0a] hover:text-[#ff5c00] transition-colors">
          ← Back to today's lyric
        </Link>
      </div>
    </div>
  )
}
