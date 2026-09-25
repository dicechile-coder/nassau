import { Link } from 'react-router-dom'
import { SITE } from '../lib/site.js'

const Mail = () => <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>

export function Privacy() {
  return (
    <main className="page legal">
      <h1 className="h2">Privacy Policy</h1>
      <p className="muted small">Last updated: {SITE.legalUpdated}</p>
      <p>This policy explains what personal data {SITE.legalName} ("we") collects when you use {SITE.name}, why, and what your rights are. Questions: <Mail />.</p>

      <h2 className="h3">What we collect</h2>
      <ul>
        <li><strong>Website messages:</strong> your name, email address and message when you use the contact or placement form on our website. We only use these to answer you.</li>
        <li><strong>Account data:</strong> your name, email address and password (the password is stored encrypted; we cannot read it).</li>
        <li><strong>Profile answers:</strong> what you enter in the course, such as the name you prefer, your country and nationality.</li>
        <li><strong>Learning data:</strong> your answers, scores, lesson progress, XP, streak and the days you practised.</li>
        <li><strong>AI conversations and writing:</strong> the messages you write to the AI tutor and the texts you submit for AI feedback, together with the feedback.</li>
        <li><strong>Technical data:</strong> basic logs needed to run and secure the service (for example the time of a request). We do not use advertising or tracking cookies.</li>
      </ul>

      <h2 className="h3">Why we use it</h2>
      <ul>
        <li>To give you access to the course, remember your progress and unlock lessons.</li>
        <li>To give you automatic feedback with the AI tutor.</li>
        <li>To check and improve the quality of the course and of the AI feedback.</li>
        <li>To contact you about your account (for example password resets).</li>
      </ul>
      <p>We do not sell your data and we do not use it for advertising.</p>

      <h2 className="h3">The AI tutor</h2>
      <p>When you use a role-play or a writing task, your text is sent to an AI model (currently Google Gemini through the OpenRouter service) to create a reply or feedback. Please do not write sensitive personal information (such as health, financial or ID details) in these exercises. AI feedback is automatic and can contain mistakes. Our staff may read AI conversations to check the quality of the feedback.</p>

      <h2 className="h3">Who processes your data for us</h2>
      <ul>
        <li><strong>Supabase</strong> — database, login and server functions.</li>
        <li><strong>Hostinger</strong> — hosting of the website.</li>
        <li><strong>OpenRouter / Google</strong> — AI replies and feedback (only the text of the AI exercises).</li>
        <li><strong>Bunny.net (Bunny Stream)</strong> — streaming of the lesson videos.</li>
      </ul>
      <p>These providers may process data outside {SITE.country}. They only process it to provide their service to us.</p>

      <h2 className="h3">How long we keep it</h2>
      <p>We keep your account and learning data while your account is active. If you ask us to delete your account, we delete your personal data within 30 days, except where we must keep something by law. AI conversation logs are kept for quality checks for at most 12 months.</p>

      <h2 className="h3">Your rights</h2>
      <p>You can ask to see, correct, export or delete your personal data, or object to how we use it. Email <Mail /> from the address you use for your account.</p>

      <h2 className="h3">Children</h2>
      <p>The course is meant for learners aged 16 and older. Younger learners may only use it with permission and supervision of a parent or guardian.</p>

      <h2 className="h3">Changes</h2>
      <p>If we change this policy, we will update the date above and, for important changes, inform you by email or in the app.</p>
      <p><Link to="/terms">Terms of Use</Link> · <Link to="/">Home</Link></p>
    </main>
  )
}

export function Terms() {
  return (
    <main className="page legal">
      <h1 className="h2">Terms of Use</h1>
      <p className="muted small">Last updated: {SITE.legalUpdated}</p>
      <p>These terms apply to your use of {SITE.name}, provided by {SITE.legalName} ({SITE.country}). By creating an account you accept them.</p>

      <h2 className="h3">1. Beta version</h2>
      <p>The platform is in beta. Features and content can change, and there may be errors or short interruptions. We appreciate your feedback at <Mail />.</p>

      <h2 className="h3">2. Your account</h2>
      <ul>
        <li>Use your own, correct details and keep your password secret. One account is for one person.</li>
        <li>You are responsible for what happens in your account. Tell us straight away if you think someone else is using it.</li>
      </ul>

      <h2 className="h3">3. Using the course</h2>
      <ul>
        <li>The course and its videos, texts and exercises are for your personal learning only. Do not copy, share or sell them.</li>
        <li>Do not try to break, overload or get around the platform, its security or its limits (for example the daily AI limits).</li>
        <li>Do not use the AI tutor for anything other than practising English, and do not write offensive or illegal content.</li>
      </ul>

      <h2 className="h3">4. AI feedback</h2>
      <p>Role-plays and writing feedback are generated automatically by AI. They are meant to help you practise and can contain mistakes. AI scores are part of your lesson result; if you think a score is clearly wrong, contact us.</p>

      <h2 className="h3">5. Levels and certificates</h2>
      <p>The course follows the CEFR level descriptions (A1). Completing the course is not an official language certificate unless we clearly state otherwise.</p>

      <h2 className="h3">6. Payment</h2>
      <p>During the beta the course is free. If paid plans are introduced, the price and conditions will be shown before you pay, and you will never be charged without agreeing first.</p>

      <h2 className="h3">7. Ending your account</h2>
      <p>You can stop at any time and ask us to delete your account. We may suspend accounts that break these terms.</p>

      <h2 className="h3">8. Liability</h2>
      <p>We do our best to keep the platform correct and available, but we provide it "as is". As far as the law allows, we are not liable for indirect damage or for loss caused by interruptions or errors.</p>

      <h2 className="h3">9. Changes and law</h2>
      <p>We may update these terms; the date above shows the latest version. The law of {SITE.country} applies.</p>
      <p><Link to="/privacy">Privacy Policy</Link> · <Link to="/">Home</Link></p>
    </main>
  )
}
