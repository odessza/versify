# Shoegaze — Project Context

## What this is
A lyric-based anonymous journalling website. Every day, one curated lyric is displayed to all visitors. Users write a response (called a "Thought") to the lyric and submit it anonymously. After submitting, they can read everyone else's Thoughts for that day. No login, no accounts.

## Core pages
- **Home (`/`)** — Displays today's lyric prominently. User writes and submits their Thought anonymously.
- **Feed (`/feed`)** — Displays all anonymous Thoughts for today's lyric, newest first. 50 per page with pagination.
- **Archive (`/archive`)** — Lists all past daily lyrics as compact rows (date, lyric snippet, thought count). Clickable to view that day's feed.

## Key product decisions
- No user accounts or login of any kind
- Anonymous user identity tracked via localStorage (key: `shoegaze_user_id`, value: `crypto.randomUUID()`)
- The user's own Thoughts are highlighted with a "You" tag in the feed, using the localStorage ID to match
- "Thoughts" is the term used everywhere for user responses — never "comments" or "responses"
- No actions on Thoughts — no editing, deleting, liking, replying, or saving. Once posted, it's permanent.
- "Write again" is allowed and creates a new Thought entry — not an edit
- Thoughts are capped at 50 per page with prev/next pagination
- The speech bubble icon (not a dot) indicates days in the archive where the user posted a Thought
- Response count ("X people have written today") only shows if count >= 1
- Album art displayed as a small clickable square (bottom-right), links to Genius.com for song/artist info

## Daily lyric pipeline (backend)
- One lyric per day, same for all users — chosen automatically via LLM (Gemini Flash)
- LLM selects artist, song, and the most "journallable" 1-2 lines using predefined parameters
- Lyrics fetched via Genius API
- Admin (owner) reviews and approves tomorrow's lyric via a simple admin view before it goes live
- Lyric published automatically at a scheduled time daily

## Design language
- White background (#ffffff)
- Black primary text (#0a0a0a)
- Orange accents (#ff5c00) for labels, tags, active states, CTAs
- Font: Helvetica Neue / Helvetica / Arial (sans-serif) throughout
- Typography-first — the lyric is always the visual hero
- Minimal UI chrome — clean, editorial, no clutter

## Tech stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS (with @tailwindcss/vite plugin)
- **Routing:** React Router DOM
- **Database:** Supabase (Postgres)
- **Avatars:** DiceBear (for anonymous user avatars in the feed)
- **LLM:** Google Gemini Flash (for daily lyric selection)
- **Lyrics API:** Genius API
- **Hosting:** Vercel

## Project structure
- `src/pages/` — top-level page components (Home, Feed, Archive)
- `src/components/` — reusable UI components
- `src/lib/` — utilities (supabase client, localStorage helpers, etc.)

## Naming conventions
- Components: PascalCase (e.g. `ThoughtCard.jsx`)
- Utilities: camelCase (e.g. `getUserId.js`)
- CSS: Tailwind utility classes only — no separate CSS files except `index.css`

## Current status
Supabase connected. All pages fetch live data. Deployed to Vercel at https://versify-shoegaze.vercel.app.

- **Schema**: `lyrics` table (id, date, lyric_text, song, artist, album_art_url, genius_url, published, approved, created_at) and `thoughts` table (id, lyric_id FK, user_id UUID, content, created_at). Index on thoughts(lyric_id, created_at desc).
- **Home**: fetches today's published lyric; submits Thoughts with anonymous user_id from localStorage
- **Feed** (`/feed` and `/feed/:date`): fetches lyric + paginated thoughts (50/page) for the given date. Gate added: users visiting `/feed` who haven't posted today see a prompt ("Aren't you nosy?...") with a "Share a Thought" CTA back to `/`. Past date feeds (`/feed/:date`) bypass the gate — always viewable.
- **Archive**: fetches all past published lyrics with thought counts and user-posted detection (3 queries, Promise.all)
- **`src/lib/supabase.js`**: Supabase client using VITE_ env vars
- **`.env`**: gitignored; holds VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GENIUS_ACCESS_TOKEN, CRON_SECRET, ADMIN_PASSWORD

- **`api/generate-lyric.js`**: daily cron at 03:30 UTC (= 09:00 IST) — calls Gemini 3 Flash to pick artist/song/lyric, calls Genius API for album art + URL, inserts draft row (`published=false, approved=false`) for tomorrow
- **`api/publish-lyric.js`**: daily cron at 18:30 UTC (= 00:00 IST) — sets `published=true` for today's lyric if `approved=true`
- **`api/admin-auth.js`**, **`api/admin-lyrics.js`**, **`api/admin-approve.js`**, **`api/admin-regenerate.js`**: admin API endpoints, all protected by HMAC token (password never in client bundle)
- **`api/_lyricPipeline.js`**: shared Gemini + Genius + Supabase insert logic used by generate and regenerate
- **`api/_adminAuth.js`**: HMAC token generation and verification
- **`api/_dateIST.js`**: IST date utility for server-side use
- **`vercel.json`**: cron schedules + SPA rewrite rule (`/((?!api/.*)` → `/index.html`)
- All cron endpoints protected with `CRON_SECRET` bearer token
- All timezone handling uses IST (UTC+5:30) throughout — both frontend (`src/lib/dateIST.js`) and backend (`api/_dateIST.js`)

- **Admin view** (`/admin`): password login → sessionStorage token. Shows pending drafts (`approved=false, published=false`) with editable lyric textarea, Approve and Regenerate buttons. Approve sets `approved=true`; Regenerate calls Gemini+Genius to replace the draft.
- **404 page** (`*`): orange "404" label, bold heading, back link to home.

⚠️ Gemini billing must be enabled on the Google Cloud project for the lyric pipeline to run (free tier has quota 0).
⚠️ When manually inserting lyrics into Supabase for testing, ensure both `approved=true` and `published=true` are set — the admin panel only shows rows where both are false.

Next:
- Rate limiting — RLS caps at 5 thoughts per user_id per lyric; IP-based limiting deferred

## General Instructions for Claude Code
- After completing any task, update the "Current status" section of this file to reflect what was completed, what changed, and what's next.
- Always refer to user responses as "Thoughts" — never "comments" or "responses".
- Always follow the design language defined above — white background, black text, orange accents, Helvetica Neue.
- Never introduce new dependencies without flagging it first.
- Keep components small and focused — one responsibility per component.

## Code quality standards
- Write clean, minimal, readable code — no unnecessary abstractions or over-engineering
- Don't create a component or utility unless it's used in at least two places or is genuinely complex enough to warrant isolation
- No commented-out code left in files
- No console.log statements left in production code
- Keep components under 150 lines where possible — if longer, consider splitting
- Use early returns to avoid deeply nested conditionals
- Prefer clear, descriptive variable names over short cryptic ones
- No inline styles — Tailwind classes only
- Don't install a library to solve something that can be done simply in 5–10 lines of vanilla JS
- If something can be a simple utility function in src/lib/, don't make it a full component
- Avoid prop drilling more than 2 levels deep — flag it if it becomes necessary
- All fetch/async calls must have error handling
- No hardcoded values that should be constants — put them in a config or constants file