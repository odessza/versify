export default function NowPlaying({ song, artist, coverUrl, geniusUrl }) {
  return (
    <a
      href={geniusUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-7 right-8 max-[560px]:bottom-4 max-[560px]:right-4 z-30 flex flex-col items-center gap-3 cursor-pointer no-underline"
    >
      <div className="vinyl">
        <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] flex items-center justify-center">
          {coverUrl ? (
            <>
              <img src={coverUrl} alt={song} className="w-full h-full object-cover" />
              <span className="absolute h-1.5 w-1.5 rounded-full bg-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]" />
            </>
          ) : (
            <div className="w-full h-full bg-[radial-gradient(circle_at_30%_30%,#ffa46b,#f9743a_60%,#e85f26)] flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]" />
            </div>
          )}
        </div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-[13px] font-bold text-ink">{song}</div>
        <div className="text-xs font-medium text-muted">{artist}</div>
      </div>
    </a>
  )
}
