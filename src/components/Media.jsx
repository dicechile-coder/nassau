// Video and audio players. Accepts Bunny Stream, YouTube, Vimeo or a direct file link (mp4 / mp3).

export function videoEmbedUrl(url) {
  if (!url) return null
  // Pasted embed code (<iframe src="…">) → use its src
  const m = String(url).match(/src=["']([^"']+)["']/i)
  if (m) url = m[1]
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    // Bunny Stream: embed, play or dashboard links → the Bunny player (no ads)
    if (['iframe.mediadelivery.net', 'player.mediadelivery.net', 'video.bunnycdn.com'].includes(host)) {
      const [, , lib, id] = u.pathname.split('/')
      if (lib && id) return `https://iframe.mediadelivery.net/embed/${lib}/${id}?autoplay=false&preload=false&responsive=true`
      return null
    }
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop()
      return `https://www.youtube-nocookie.com/embed/${id}`
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return host.startsWith('player.') ? url : `https://player.vimeo.com/video/${id}`
    }
  } catch { return null }
  return null
}

export function Video({ url, title = 'Story video' }) {
  if (!url) return <div className="video-placeholder" aria-label="Story video">🎬 Story video coming soon</div>
  const embed = videoEmbedUrl(url)
  if (embed) {
    return (
      <div className="video-frame">
        <iframe src={embed} title={title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
      </div>
    )
  }
  return <video className="video-file" src={url} controls playsInline preload="metadata" />
}

export function Audio({ url }) {
  if (!url) return null
  return <audio className="audio-player" src={url} controls preload="none" />
}
