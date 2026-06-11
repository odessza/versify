export async function notify(level, source, message) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  const icon = level === 'error' ? '🚨' : '⚠️'
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `${icon} *${source}*\n${message}` }),
  }).catch(() => {})
}
