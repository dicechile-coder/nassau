// Video and audio players. Accepts YouTube, Vimeo or a direct file link (mp4 / mp3).

export function videoEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
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
