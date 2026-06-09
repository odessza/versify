import { Link } from 'react-router-dom'

const today = new Date().toLocaleDateString('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function Nav() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#0a0a0a]/10">
      <Link to="/" className="text-sm font-bold tracking-widest uppercase text-[#0a0a0a]">
        Shoegaze
      </Link>
      <span className="text-sm text-[#0a0a0a]/50">{today}</span>
      <Link
        to="/archive"
        className="text-sm font-medium text-[#0a0a0a] hover:text-[#ff5c00] transition-colors"
      >
        Archive
      </Link>
    </header>
  )
}
