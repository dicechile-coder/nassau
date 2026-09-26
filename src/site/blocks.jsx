import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../lib/site.js'
import { videoEmbedUrl } from '../components/Media.jsx'
import { LANGUAGES, LANGUAGE_ORDER, STATUS, CAST, FAQ, STILLS } from './content.js'
import { IconCheck, IconArrow, IconPlay, IconTarget, IconCap, IconShield } from './icons.jsx'

export function Head({ kicker, title, text, center, kickerClass = '' }) {
  return (
    <div className={`s-head${center ? ' center' : ''}`}>
      <div>
        {kicker && <span className={`s-kicker ${kickerClass}`}>{kicker}</span>}
        <h2 className="s-h2">{title}</h2>
      </div>
      {text && <p className="s-lead">{text}</p>}
    </div>
  )
}

export function Checks({ items, color = '#4E7A2E' }) {
  return (
    <ul className="s-list">
      {items.map(t => <li key={t}><IconCheck size={20} color={color} />{t}</li>)}
    </ul>
  )
}

// Slider: moves to the next slide every few seconds; stops while paused or when the visitor prefers less motion.
function useSlider(count, ms = 5000, paused = false) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (paused || count < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI(n => (n + 1) % count), ms)
    return () => clearInterval(t)
  }, [count, ms, paused])
  return [i, setI]
}

function SlideDots({ slides, active, onPick }) {
  return (
    <span className="s-dots" role="tablist" aria-label="Courses">
      {slides.map((s, n) => (
        <button key={s.lang} type="button" role="tab" aria-selected={n === active}
                className={n === active ? 'on' : ''} style={{ '--dot': LANGUAGES[s.lang].color }}
                aria-label={LANGUAGES[s.lang].name} onClick={() => onPick(n)} />
      ))}
    </span>
  )
}

function SlideImages({ slides, active, eager = false }) {
  return slides.map((s, n) => (
    <img key={s.src} src={s.src} width="1280" height="720" alt={n === active ? s.alt : ''} aria-hidden={n !== active}
         loading={eager && n === 0 ? undefined : 'lazy'} className={`s-fade${n === active ? ' on' : ''}${n > 0 ? ' s-fade-abs' : ''}`} />
  ))
}

// Episode 1 preview: English, Dutch and Spanish stills in turn; the real Bunny player loads on click.
export function EpisodePreview() {
  const slides = STILLS.hero
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState(false)
  const [i, setI] = useSlider(slides.length, 5000, playing || hover)
  const cur = slides[i]
  const embed = videoEmbedUrl(SITE.episode1Urls?.[cur.lang] || SITE.episode1Url)
  return (
    <div className="s-video" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {playing && embed ? (
        <iframe src={embed.replace('autoplay=false', 'autoplay=true')} title={`Episode 1: ${cur.title}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <>
          <SlideImages slides={slides} active={i} eager />
          <span className="s-slide-lang" style={{ background: LANGUAGES[cur.lang].color }}>{LANGUAGES[cur.lang].native}</span>
          <div className="s-video-bar">
            <button type="button" className="s-play" aria-label={`Play episode 1 (${LANGUAGES[cur.lang].name})`} onClick={() => setPlaying(true)}><IconPlay /></button>
            <div className="s-video-meta"><small>{cur.label}</small><strong>{cur.title}</strong></div>
            <SlideDots slides={slides} active={i} onPick={setI} />
          </div>
        </>
      )}
    </div>
  )
}

export function LessonSteps() {
  return (
    <div className="s-grid s-grid-4">
      <div className="s-card">
        <div className="s-step-visual"><img src="/site/still-e03.webp" width="1280" height="720" alt="Maya explains the letters E and I to Luis" loading="lazy" /></div>
        <div className="s-card-body"><span className="s-step-num">01</span><h3 className="s-h3">Watch</h3>
          <p className="s-text">A one-minute episode shows the new language in a real situation, with every new phrase on screen.</p></div>
      </div>
      <div className="s-card">
        <div className="s-mock blue" aria-hidden="true">
          <span className="s-mock-label">COMPLETE THE SENTENCE</span>
          <div className="s-mock-q">____ from Colombia.</div>
          <div className="s-chips"><span className="s-chip on">I’m</span><span className="s-chip">Am</span><span className="s-chip">My</span></div>
        </div>
        <div className="s-card-body"><span className="s-step-num">02</span><h3 className="s-h3">Practise</h3>
          <p className="s-text">Short exercises with instant feedback: listening, word order, spelling and your own sentences.</p></div>
      </div>
      <div className="s-card">
        <div className="s-mock green" aria-hidden="true">
          <div className="s-bubble them"><b>Nate:</b> Hi! I’m Nate. What’s your name?</div>
          <div className="s-bubble me">I’m Carla. Nice to meet you!</div>
          <div className="s-bubble them"><b>Nate:</b> Perfect. Where are you from?</div>
        </div>
        <div className="s-card-body"><span className="s-step-num">03</span><h3 className="s-h3">Talk with Nate</h3>
          <p className="s-text">A role-play with your AI tutor. He corrects gently and explains in simple words. Speaking by microphone is coming next.</p></div>
      </div>
      <div className="s-card">
        <div className="s-mock orange" aria-hidden="true">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1B3A5F', fontSize: 15 }}><span>Lesson 3</span><span>86%</span></div>
          <div className="s-bar"><div style={{ width: '86%' }} /></div>
          <div className="s-chips"><span className="s-tag green">Lesson 4 unlocked</span><span className="s-tag">5-day streak</span></div>
        </div>
        <div className="s-card-body"><span className="s-step-num">04</span><h3 className="s-h3">Move on when you’re ready</h3>
          <p className="s-text">Score 70% and the next lesson opens. Go back to any lesson, any time. No timers, no pressure.</p></div>
      </div>
    </div>
  )
}

function BandSlider() {
  const slides = STILLS.band
  const [i, setI] = useSlider(slides.length, 5000)
  return (
    <div className="s-band-img">
      <SlideImages slides={slides} active={i} />
      <span className="s-slide-lang" style={{ background: LANGUAGES[slides[i].lang].color }}>{LANGUAGES[slides[i].lang].native}</span>
      <SlideDots slides={slides} active={i} onPick={setI} />
    </div>
  )
}

export function StoryBand() {
  return (
    <section className="s-band">
      <div className="s-wrap">
        <div className="s-band-top">
          <div>
            <span className="s-kicker light">A STORY WORTH FOLLOWING</span>
            <h2 className="s-h2">Meet the class. Learn right alongside them.</h2>
            <p className="s-lead">In every course, a group of strangers meets in Curaçao. Over 16 episodes they become friends, go to the beach, get lost in Punda and learn to get around the island. You learn every word right alongside them.</p>
          </div>
          <BandSlider />
        </div>
        <div className="s-cast">
          {CAST.map(([id, name, line]) => (
            <div key={id} className="s-cast-card">
              <img src={`/site/char-${id}.webp`} alt={name} loading="lazy" height="200" />
              <strong>{name}</strong><span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Differences() {
  return (
    <div className="s-grid s-grid-3">
      <div className="s-card s-feature">
        <div className="s-icon orange"><IconTarget size={28} color="#D65E22" /></div>
        <h3 className="s-h3" style={{ fontSize: 26 }}>Made for your mistakes</h3>
        <p className="s-text">Every group of learners makes its own predictable mistakes, like “Am Luis” from a Spanish speaker learning English. Our courses teach them on purpose, inside the story, so the right form sticks.</p>
      </div>
      <div className="s-card s-feature">
        <div className="s-icon blue"><IconCap size={28} color="#3E6A9E" /></div>
        <h3 className="s-h3" style={{ fontSize: 26 }}>Written by a real teacher</h3>
        <p className="s-text">Every lesson is designed by a working language teacher and follows the CEFR, the European standard used by schools and exams worldwide.</p>
      </div>
      <div className="s-card s-feature">
        <div className="s-icon green"><IconShield size={28} color="#4E7A2E" /></div>
        <h3 className="s-h3" style={{ fontSize: 26 }}>Honest by design</h3>
        <p className="s-text">No ads, no “lives”, no tricks to keep you on your phone. One clear price, and you move on when you’ve really learned it.</p>
      </div>
    </div>
  )
}

export function LanguageCards() {
  return (
    <div className="s-grid s-grid-3">
      {LANGUAGE_ORDER.map(key => {
        const l = LANGUAGES[key]
        return (
          <div key={key} className={`s-card s-lang${l.featured ? ' featured' : ''}`}>
            <div className="s-lang-top" style={{ background: l.color }} />
            <div className="s-lang-body">
              <span className="s-lang-native" style={{ color: l.nativeColor }}>{l.native}</span>
              <h3>{l.name}</h3>
              <p className="s-text">{l.intro}</p>
              <div className="s-rows">
                {l.rows.map(([label, st]) => (
                  <div key={label}><span>{label}</span><b className={STATUS[st][1]}>{STATUS[st][0]}</b></div>
                ))}
              </div>
              <Link to={`/courses/${l.slug}`} className="s-link-arrow">Explore {l.name} courses <IconArrow size={18} /></Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TwoWays() {
  const price = SITE.selfStudyPrice
  return (
    <div className="s-grid s-grid-2">
      <div className="s-card s-plan featured">
        <div className="s-plan-head"><h3>Self-study with Nate</h3><span className="s-badge green">Available now</span></div>
        <p className="s-lead" style={{ fontSize: 18 }}>English, Dutch and Spanish. At your own pace, on any device.</p>
        <Checks items={['A story episode in every lesson', 'Interactive exercises with instant feedback', 'Role-play conversations with Nate, your AI tutor', 'Progress, streaks and a clear path per level']} />
        <div className="s-price"><strong>{price || 'Price soon'}</strong><span>{price ? 'per level half (A1.1)' : 'announced before launch'}</span></div>
        <Link to="/signup" className="s-btn s-btn-primary">Try a free lesson</Link>
      </div>
      <div className="s-card s-plan">
        <div className="s-plan-head"><h3>With a real teacher</h3><span className="s-badge blue">Curaçao or online</span></div>
        <p className="s-lead" style={{ fontSize: 18 }}>Dutch, English and Spanish, in a group or one-to-one.</p>
        <Checks color="#3E6A9E" items={['Live group classes or private lessons', 'NT2 and Dutch Naturalization exam preparation', 'Online practice platform between classes', 'Personal feedback, with a free placement talk first']} />
        <div className="s-price"><strong>On request</strong><span>a quote after your placement talk</span></div>
        <Link to="/placement" className="s-btn s-btn-dark">Book a placement talk</Link>
      </div>
    </div>
  )
}

export function FaqList({ items = FAQ }) {
  return (
    <div>
      {items.map(([q, a]) => (
        <details key={q}><summary>{q}</summary><p>{a}</p></details>
      ))}
    </div>
  )
}

// Final call to action. On a course page (lang = 'dutch' | 'english' | 'spanish') it shows that course's still;
// elsewhere the three courses take turns.
export function FinalCta({ lang }) {
  const all = STILLS.cta
  const slides = lang ? all.filter(s => s.lang === lang) : all
  const [i, setI] = useSlider(slides.length, 5000)
  return (
    <section className="s-section">
      <div className="s-wrap">
        <div className="s-cta">
          {slides.map((s, n) => <img key={s.src} src={s.src} alt="" loading="lazy" className={`s-fade${n === i ? ' on' : ''}`} />)}
          {slides.length > 1 && <SlideDots slides={slides} active={i} onPick={setI} />}
          <div>
            <h2>Your first lesson is waiting.</h2>
            <p>Try a free lesson in English, Dutch or Spanish, or book a free placement talk for Dutch, English or Spanish.</p>
            <div className="s-btns">
              <Link to="/signup" className="s-btn s-btn-primary">Try a free lesson</Link>
              <Link to="/placement" className="s-btn s-btn-white">Book a placement talk</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
