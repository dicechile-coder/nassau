import { Link } from 'react-router-dom'
import { usePageMeta } from '../SiteLayout.jsx'
import { Head, EpisodePreview, LessonSteps, StoryBand, Differences, LanguageCards, TwoWays, FaqList, FinalCta } from '../blocks.jsx'
import { IconArrow, IconCheck } from '../icons.jsx'

export default function Home() {
  usePageMeta(null, 'Learn Dutch, English or Spanish through stories, practice and conversation — with a real teacher or on your own with Nate, your AI tutor. Made in Curaçao, CEFR-aligned.')
  return (
    <>
      <section className="s-hero">
        <div className="s-wrap">
          <div className="s-hero-copy">
            <div className="s-brandline"><img src="/site/logo-icon.png" alt="" width="28" height="28" /><span className="s-kicker green">The Future of Learning</span></div>
            <h1 className="s-h1">Learn to speak. Through stories, not textbooks.</h1>
            <p className="s-lead">Dutch, English and Spanish, live with a real teacher or on your own with Nate, your AI tutor. Every course is written by a teacher in Curaçao and aligned with the CEFR, from your very first word.</p>
            <div className="s-pills" aria-label="Languages">
              <Link to="/courses/dutch" className="s-pill">Nederlands</Link>
              <Link to="/courses/english" className="s-pill">English</Link>
              <Link to="/courses/spanish" className="s-pill">Español</Link>
            </div>
            <div className="s-btns">
              <Link to="/signup" className="s-btn s-btn-primary">Try a free lesson <IconArrow size={20} /></Link>
              <Link to="/how-it-works" className="s-btn s-btn-outline">See how it works</Link>
            </div>
            <div className="s-checks">
              <span><IconCheck size={18} color="#4E7A2E" />Free, no credit card</span>
              <span><IconCheck size={18} color="#4E7A2E" />About 20 minutes</span>
              <span><IconCheck size={18} color="#4E7A2E" />Start from zero</span>
            </div>
          </div>
          <div className="s-hero-visual">
            <div className="s-hero-blob" />
            <EpisodePreview />
            <div className="s-float s-float-badge"><span className="s-tick"><IconCheck size={15} color="#fff" /></span>Lesson 1 complete · 92%</div>
            <div className="s-float s-float-chat">
              <div className="s-float-head"><span className="s-avatar">N</span>Nate · your AI tutor</div>
              <p>Nice! Almost perfect: say <strong>“I’m Luis”</strong>, not “Am Luis”. Now, where are you from?</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="s-wrap">
          <div className="s-proof">
            <div><strong>3 languages</strong><span>Dutch, English and Spanish, A1 to C2</span></div>
            <div><strong>Story-based</strong><span>16 episodes in every level half</span></div>
            <div><strong>CEFR-aligned</strong><span>The European standard for language levels</span></div>
            <div><strong>No ads. Ever.</strong><span>No lives, no tricks, no distractions</span></div>
          </div>
        </div>
      </section>

      <section className="s-section" id="how">
        <div className="s-wrap">
          <Head kicker="How a lesson works" title="One lesson, four steps. The same rhythm every time."
                text="No grammar tables to memorise first. You see the language used by real people in a real place, then you use it yourself. Shown here: our English self-study course." />
          <LessonSteps />
        </div>
      </section>

      <StoryBand />

      <section className="s-section">
        <div className="s-wrap">
          <Head kicker="Quality over quantity" title="Built to make you speak, not to keep you scrolling." />
          <Differences />
        </div>
      </section>

      <section className="s-section">
        <div className="s-wrap">
          <Head kicker="Our languages" title="Dutch, English or Spanish. Pick yours."
                text="All three from A1 to C2, with a real teacher today. Self-study with Nate starts with English; Dutch comes next, then Spanish." />
          <LanguageCards />
        </div>
      </section>

      <section className="s-section">
        <div className="s-wrap">
          <Head center kicker="Two ways to learn" title="On your own with Nate, or live with a teacher." />
          <TwoWays />
        </div>
      </section>

      <section className="s-section">
        <div className="s-wrap">
          <div className="s-teacher">
            <div className="s-teacher-photo has-img"><img src="/site/teacher.webp" width="760" height="880" loading="lazy" alt="Illustration of Ferry Seegers, founder of Nassau Academy" /></div>
            <div>
              <span className="s-kicker green">Behind Nassau Academy</span>
              <h2 className="s-h2" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>A teacher, not a tech company.</h2>
              <p className="s-lead">Nassau Academy was founded in Curaçao by Ferry Seegers, a language teacher with 30 years in the classroom. Every episode, exercise and conversation with Nate is built the way a good teacher helps you: patient, precise and encouraging.</p>
              <p className="s-quote">“My goal is simple: that you can really speak the language.”</p>
              <span className="s-text">Ferry Seegers, founder and teacher</span>
            </div>
          </div>
        </div>
      </section>

      <section className="s-section">
        <div className="s-wrap s-faq">
          <div className="s-faq-side">
            <span className="s-kicker">Questions</span>
            <h2 className="s-h2" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>Good to know before you start.</h2>
            <Link to="/contact" className="s-link-arrow">More questions? Contact us <IconArrow size={18} /></Link>
          </div>
          <FaqList />
        </div>
      </section>

      <FinalCta />
    </>
  )
}
