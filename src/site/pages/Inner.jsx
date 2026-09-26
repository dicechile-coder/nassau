import { Link, Navigate, useParams } from 'react-router-dom'
import { extractEmbedUrl } from '../../lib/adminApi.js'
import { usePageMeta } from '../SiteLayout.jsx'
import { SITE } from '../../lib/site.js'
import { LANGUAGES, A1_MODULES, FAQ } from '../content.js'
import { Head, Checks, LessonSteps, StoryBand, Differences, LanguageCards, TwoWays, FaqList, FinalCta } from '../blocks.jsx'
import MessageForm from '../MessageForm.jsx'
import { IconArrow, IconMail, IconChat, IconPin } from '../icons.jsx'

function PageHero({ kicker, title, children, center }) {
  return (
    <section className={`s-page-hero${center ? ' center' : ''}`}>
      <div className="s-wrap">
        <span className="s-kicker">{kicker}</span>
        <h1 className="s-h1" style={{ fontSize: 'clamp(38px, 5.4vw, 62px)' }}>{title}</h1>
        {children}
      </div>
    </section>
  )
}

const CEFR = [
  ['A1', 'First words', 'Introduce yourself, ask simple questions, understand slow, clear speech.'],
  ['A2', 'Everyday basics', 'Shopping, directions, work and family; short messages and conversations.'],
  ['B1', 'Independent', 'Handle most situations when travelling or at work; tell stories and give opinions.'],
  ['B2', 'Confident', 'Follow discussions and TV; speak fluently with native speakers.'],
  ['C1', 'Advanced', 'Use the language flexibly for study and professional work.'],
  ['C2', 'Mastery', 'Understand virtually everything; express yourself precisely and naturally.'],
]

/* ------------------------------ Courses ------------------------------ */
export function Courses() {
  usePageMeta('Courses', 'Dutch, English and Spanish courses from A1 to C2 — self-study with Nate or live with a teacher, in Curaçao or online.')
  return (
    <>
      <PageHero kicker="Our courses" title="Dutch, English or Spanish. From your first word to fluency.">
        <p className="s-lead">Every course follows the CEFR, the European standard for language levels. Learn live with a teacher today; self-study with Nate starts with English, then Dutch and Spanish.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 64 }}><div className="s-wrap"><LanguageCards /></div></section>
      <section className="s-section">
        <div className="s-wrap">
          <Head kicker="One roadmap, every language" title="Six levels, one clear path." text="Not sure where you are? A free placement talk with a teacher finds your level in 15–20 minutes." />
          <div className="s-table-wrap">
            <table className="s-table">
              <thead><tr><th>Level</th><th>In plain words</th><th>What you can do</th></tr></thead>
              <tbody>{CEFR.map(([l, n, d]) => <tr key={l}><td><strong>{l}</strong></td><td>{n}</td><td>{d}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="s-btns" style={{ marginTop: 28 }}><Link to="/placement" className="s-btn s-btn-dark">Book a free placement talk</Link></div>
        </div>
      </section>
      <section className="s-section"><div className="s-wrap"><Head center kicker="Two ways to learn" title="On your own with Nate, or live with a teacher." /><TwoWays /></div></section>
      <FinalCta />
    </>
  )
}

/* --------------------------- One language --------------------------- */
export function CoursePage() {
  const { lang } = useParams()
  const l = LANGUAGES[lang]
  usePageMeta(l ? `${l.name} courses` : 'Courses', l?.hero)
  if (!l) return <Navigate to="/courses" replace />
  const isEnglish = lang === 'english'
  return (
    <>
      <PageHero kicker={l.native} title={`Learn ${l.name} at Nassau Academy`}>
        <p className="s-lead">{l.hero}</p>
        <div className="s-btns">
          <Link to="/signup" className="s-btn s-btn-primary">Try a free lesson <IconArrow size={20} /></Link>
          {!isEnglish && <Link to="/placement" className="s-btn s-btn-outline">Book a free placement talk</Link>}
          {SITE.levelTests?.[lang] && <Link to={`/level-test/${lang}`} className="s-btn s-btn-outline">Take the level test</Link>}
          {isEnglish
            ? <Link to="/placement" className="s-btn s-btn-outline">Book a placement talk</Link>
            : <a href={SITE.moodleUrl} className="s-btn s-btn-outline" target="_blank" rel="noopener">Student login (Academy)</a>}
        </div>
      </PageHero>

      <section className="s-section" style={{ paddingTop: 72 }}>
        <div className="s-wrap">
          <div className={`s-grid ${l.tracks.length === 4 ? 's-grid-2' : 's-grid-3'}`}>
            {l.tracks.map(([t, d]) => (
              <div key={t} className="s-card s-feature"><h3 className="s-h3">{t}</h3><p className="s-text">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {isEnglish ? (
        <>
          <section className="s-section">
            <div className="s-wrap">
              <Head kicker="Self-study · Level A1.1" title="16 lessons in 4 modules. One story from start to finish."
                    text="Each lesson takes about 20–30 minutes. Pass with 70% and the next one opens. Level A1.2 follows." />
              <div className="s-modules">
                {A1_MODULES.map(([t, ls], i) => (
                  <div key={t} className="s-module"><small>MODULE {i + 1}</small><h3 className="s-h3">{t}</h3>
                    <ul>{ls.map(x => <li key={x}>{x}</li>)}</ul></div>
                ))}
              </div>
            </div>
          </section>
          <section className="s-section"><div className="s-wrap"><Head kicker="How a lesson works" title="Watch, practise, talk, move on." /><LessonSteps /></div></section>
          <StoryBand />
        </>
      ) : (
        <section className="s-section">
          <div className="s-wrap">
            <div className="s-teacher" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <span className="s-kicker green">Self-study with Nate</span>
                <h2 className="s-h2" style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}>{lang === 'dutch' ? 'Dutch self-study is coming next.' : 'Spanish self-study follows after Dutch.'}</h2>
                <p className="s-lead">We are building {l.name} the same way as our English course: story episodes, interactive exercises and conversations with Nate. Until then, learn with a teacher, in Curaçao or online.</p>
                <div className="s-btns"><Link to="/contact" className="s-btn s-btn-dark">Keep me informed</Link></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="s-section">
        <div className="s-wrap s-faq">
          <div className="s-faq-side"><span className="s-kicker">Questions</span><h2 className="s-h2" style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}>Good to know.</h2></div>
          <FaqList />
        </div>
      </section>
      <FinalCta lang={lang} />
    </>
  )
}

/* ---------------------------- How it works ---------------------------- */
export function HowItWorks() {
  usePageMeta('How it works', 'Watch a story episode, practise with instant feedback, talk with Nate your AI tutor, and move on when you have really learned it.')
  return (
    <>
      <PageHero kicker="How it works" title="Watch. Practise. Talk. Move on when you’re ready.">
        <p className="s-lead">Our self-study courses replace textbooks and workbooks with a story you follow, short exercises and real conversation practice. Every lesson follows the same rhythm, so you always know what’s next.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 72 }}><div className="s-wrap"><LessonSteps /></div></section>
      <StoryBand />
      <section className="s-section">
        <div className="s-wrap">
          <div className="s-grid s-grid-2" style={{ alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <span className="s-kicker">Meet Nate</span>
              <h2 className="s-h2">Your AI tutor, in every lesson.</h2>
              <p className="s-lead">Nate plays a role with you: the receptionist, a new classmate, the shop owner. You answer in the language you are learning; he replies, corrects gently and explains in simple words.</p>
              <Checks items={['Available day and night, as patient as you need', 'Corrections that explain why, not just what', 'Your writing checked with a score and tips', 'Typed today; spoken conversations are coming']} />
            </div>
            <div className="s-card" style={{ padding: 28, gap: 12, background: '#F1F6EA' }} aria-hidden="true">
              <div className="s-bubble them" style={{ maxWidth: 360 }}><b>Nate:</b> Hello! I’m Jan from reception. What’s your name?</div>
              <div className="s-bubble me" style={{ maxWidth: 300 }}>Am Carla.</div>
              <div className="s-bubble them" style={{ maxWidth: 360 }}><b>Nate:</b> Nice to meet you, Carla! Small tip: in English we say <b>“I’m Carla”</b>. Where are you from?</div>
              <div className="s-bubble me" style={{ maxWidth: 300 }}>I’m from Curaçao!</div>
            </div>
          </div>
        </div>
      </section>
      <section className="s-section">
        <div className="s-wrap">
          <Head kicker="Your progress" title="Real progress, not just points." />
          <div className="s-steps">
            <div><h3 className="s-h3">70% to move on</h3><p className="s-text">Each lesson ends with a score. At 70% or more, the next lesson opens, so you build on something solid.</p></div>
            <div><h3 className="s-h3">Go back any time</h3><p className="s-text">Finished lessons stay open. Review, redo and improve your score whenever you like. No timers.</p></div>
            <div><h3 className="s-h3">Streaks that help</h3><p className="s-text">XP and a daily streak keep you going, with a free “freeze” each week for busy days.</p></div>
          </div>
        </div>
      </section>
      <section className="s-section"><div className="s-wrap"><Head kicker="Quality over quantity" title="Built to make you speak, not to keep you scrolling." /><Differences /></div></section>
      <FinalCta />
    </>
  )
}

/* ------------------------------- Pricing ------------------------------- */
export function Pricing() {
  usePageMeta('Pricing', 'Self-study with Nate or live classes with a teacher. Try a free lesson in English, Dutch or Spanish, or book a free placement talk.')
  return (
    <>
      <PageHero center kicker="Pricing" title="Clear prices. No surprises.">
        <p className="s-lead">Start with a free lesson or a free placement talk. No credit card, no automatic payments.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 64 }}><div className="s-wrap"><TwoWays /></div></section>
      <section className="s-section">
        <div className="s-wrap">
          <Head kicker="Compare" title="Which way fits you?" />
          <div className="s-table-wrap">
            <table className="s-table">
              <thead><tr><th></th><th>Self-study with Nate</th><th>With a real teacher</th></tr></thead>
              <tbody>
                <tr><td><strong>Languages</strong></td><td>English now; Dutch next, then Spanish</td><td>Dutch, English, Spanish</td></tr>
                <tr><td><strong>When</strong></td><td>Any time, at your own pace</td><td>Scheduled classes, in Curaçao or online</td></tr>
                <tr><td><strong>Feedback</strong></td><td>Instant, from the exercises and Nate</td><td>Personal, from your teacher</td></tr>
                <tr><td><strong>Exam prep</strong></td><td>—</td><td>NT2 and Dutch Naturalization</td></tr>
                <tr><td><strong>Start</strong></td><td>Free first lesson</td><td>Free placement talk</td></tr>
                <tr><td><strong>Price</strong></td><td>{SITE.selfStudyPrice || 'Announced before launch'}</td><td>Quote after your placement talk</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="s-section">
        <div className="s-wrap s-faq">
          <div className="s-faq-side"><span className="s-kicker">Pricing questions</span><h2 className="s-h2" style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}>Good to know.</h2></div>
          <FaqList items={[
            ['Do I need a credit card for the free lesson?', 'No. Create an account with your email and start Lesson 1 right away.'],
            ['How are teacher-led courses billed?', 'Per term, with no long-term contract. You receive a personal quote after your placement talk.'],
            ['Can I switch between self-study and a teacher?', 'Yes. Many students combine both: classes with a teacher and extra practice with Nate.'],
            FAQ[0],
          ]} />
        </div>
      </section>
      <FinalCta />
    </>
  )
}

/* ------------------------------ Placement ------------------------------ */
export function Placement() {
  usePageMeta('Placement talk', 'Book a free 15–20 minute placement talk with a Nassau teacher — in person in Curaçao or online.')
  return (
    <>
      <PageHero kicker="Find your level" title="A free placement talk with a teacher.">
        <p className="s-lead">Not sure where to start? A short conversation with a Nassau teacher finds your level better than any automated quiz. Free, no obligation, and beginners are very welcome.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 72 }}>
        <div className="s-wrap">
          <div className="s-steps">
            <div><h3 className="s-h3">Tell us your goal</h3><p className="s-text">Work, study, family, an exam or just for fun: fill in the form below.</p></div>
            <div><h3 className="s-h3">Talk with a teacher</h3><p className="s-text">A relaxed 15–20 minute conversation, in person in Curaçao or online. It’s not a test you can fail.</p></div>
            <div><h3 className="s-h3">Start at the right level</h3><p className="s-text">You get advice on the best course and level, and a quote for classes with a teacher.</p></div>
          </div>
        </div>
      </section>
      <section className="s-section">
        <div className="s-wrap">
          <div className="s-grid s-grid-2" style={{ alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span className="s-kicker">Request your talk</span>
              <h2 className="s-h2" style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}>We’ll contact you within 1–2 working days.</h2>
              <p className="s-lead">Learning on your own? You can also skip the talk and start with a free lesson right away.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/level-test/dutch" className="s-link-arrow">Learning Dutch? Take the level test first <IconArrow size={18} /></Link>
                <Link to="/signup" className="s-link-arrow">Try a free lesson <IconArrow size={18} /></Link>
              </div>
            </div>
            <div className="s-form-card"><MessageForm kind="placement" submitLabel="Request my placement talk" /></div>
          </div>
        </div>
      </section>
    </>
  )
}

/* -------------------------------- About -------------------------------- */
export function About() {
  usePageMeta('About', 'Nassau Academy is a language school from Curaçao: real teachers, a practice platform that keeps you speaking, and story-based self-study courses.')
  return (
    <>
      <PageHero kicker="About us" title="Real teachers. A platform that keeps you speaking.">
        <p className="s-lead">Nassau Academy is a language school from Curaçao, teaching Dutch, English and Spanish on the island and online. We were founded on one idea: teaching and practice should never be separated.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 72 }}>
        <div className="s-wrap">
          <div className="s-teacher">
            <div className="s-teacher-photo has-img"><img src="/site/teacher.webp" width="760" height="880" loading="lazy" alt="Illustration of Ferry Seegers, founder of Nassau Academy" /></div>
            <div>
              <span className="s-kicker green">Our story</span>
              <h2 className="s-h2" style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}>A teacher, not a tech company.</h2>
              <p className="s-lead">Nassau Academy was founded in Curaçao by Ferry Seegers, a language teacher with 30 years in the classroom. After years of seeing students forget what they learned between classes, we built a way to keep practising: story episodes, instant feedback and Nate, an AI tutor modelled on the way a good teacher helps.</p>
              <p className="s-quote">“My goal is simple: that you can really speak the language.”</p>
              <span className="s-text">Ferry Seegers, founder and teacher</span>
            </div>
          </div>
        </div>
      </section>
      <section className="s-section"><div className="s-wrap"><Head kicker="What we believe" title="Quality over quantity." /><Differences /></div></section>
      <section className="s-section">
        <div className="s-wrap">
          <Head kicker="Curaçao roots, global reach" title="Made for the learners of our island, and beyond." text="Papiamentu, Dutch, Spanish and English meet every day in Curaçao. Our courses are built for learners who switch between languages, and know the mistakes they tend to make." />
        </div>
      </section>
      <FinalCta />
    </>
  )
}

/* ------------------------------- Contact ------------------------------- */
export function Contact() {
  usePageMeta('Contact', `Questions about courses, prices or the placement talk? Email ${SITE.contactEmail} or WhatsApp ${SITE.whatsapp}.`)
  return (
    <>
      <PageHero kicker="Contact" title="We’d love to hear from you.">
        <p className="s-lead">Questions about a course, prices or your level? Send us a message. We reply within 1–2 working days.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 72 }}>
        <div className="s-wrap">
          <div className="s-grid s-grid-2" style={{ alignItems: 'start' }}>
            <div className="s-contact-list">
              <div className="s-contact-item"><div className="s-icon blue"><IconMail color="#3E6A9E" /></div><div><strong>Email</strong><a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></div></div>
              <div className="s-contact-item"><div className="s-icon green"><IconChat color="#4E7A2E" /></div><div><strong>WhatsApp</strong><a href={SITE.whatsappUrl} target="_blank" rel="noopener">{SITE.whatsapp}</a></div></div>
              <div className="s-contact-item"><div className="s-icon orange"><IconPin color="#D65E22" /></div><div><strong>Where</strong><span className="s-text">Curaçao, Dutch Caribbean — and online worldwide</span></div></div>
              <div className="s-contact-item" style={{ marginTop: 12 }}><div><strong>Already a student with a teacher?</strong><a href={SITE.moodleUrl} target="_blank" rel="noopener">Log in to the Academy</a></div></div>
            </div>
            <div className="s-form-card"><h2 className="s-h3">Send us a message</h2><MessageForm kind="contact" /></div>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------ Level test ------------------------------ */
const TEST_LANG = { dutch: ['Dutch', 'Nederlands'] }

export function LevelTest() {
  const { lang } = useParams()
  const names = TEST_LANG[lang]
  const test = SITE.levelTests?.[lang]
  usePageMeta(names ? `${names[0]} level test` : 'Level test', names ? `Find your ${names[0]} level with a free online test, then book a placement talk with a Nassau teacher.` : undefined)
  if (!names) return <Navigate to="/placement" replace />
  const url = test?.h5pUrl ? extractEmbedUrl(test.h5pUrl) || test.h5pUrl : null
  return (
    <>
      <PageHero kicker={`${names[1]} · level test`} title={`What is your ${names[0]} level?`}>
        <p className="s-lead">A free online test with listening, reading and grammar questions. It takes about 20–30 minutes. Afterwards, a teacher helps you choose the right course or exam preparation.</p>
      </PageHero>
      <section className="s-section" style={{ paddingTop: 56 }}>
        <div className="s-wrap">
          {url ? (
            <div className="s-test-frame">
              <iframe title={`${names[0]} level test`} src={url} style={{ height: test.height || 700 }} allowFullScreen loading="lazy" />
            </div>
          ) : (
            <div className="s-test-placeholder" role="status">
              <strong>The online {names[0]} level test is coming soon.</strong>
              <span>Until then, a teacher can find your level in a free 15–20 minute placement talk.</span>
              <Link to="/placement" className="s-btn s-btn-primary">Book a placement talk</Link>
            </div>
          )}
          <div className="s-steps" style={{ marginTop: 48 }}>
            <div><h3 className="s-h3">Do the test</h3><p className="s-text">Answer at your own pace. Not sure? Skip the question instead of guessing.</p></div>
            <div><h3 className="s-h3">Note your score</h3><p className="s-text">At the end you see your result. Write it down or take a screenshot.</p></div>
            <div><h3 className="s-h3">Talk with a teacher</h3><p className="s-text">Share your result in the placement form. We advise you on the right level, course or exam track.</p></div>
          </div>
        </div>
      </section>
    </>
  )
}
