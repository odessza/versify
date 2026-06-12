import { Link } from 'react-router-dom'

const today = new Date().toLocaleDateString('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

export default function Nav() {
  return (
    <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center px-8 py-5 border-b border-line bg-white/60 backdrop-blur-sm">
      <Link to="/" className="font-sans font-extrabold text-[15px] tracking-[0.22em] text-ink uppercase">
        SHOEGAZE
      </Link>
      <span className="font-sans font-extrabold text-[19px] tracking-tight text-center text-ink">{today}</span>
      <Link
        to="/archive"
        className="justify-self-end font-sans font-semibold text-[14.5px] text-orange rounded-full px-4 py-2 transition-colors hover:bg-orange-soft hover:text-orange-dark"
      >
        Archive
      </Link>
    </header>
  )
}
