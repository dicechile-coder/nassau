import { Routes, Route } from 'react-router-dom'
import { isConfigured } from './lib/supabase.js'
import Header from './components/Header.jsx'
import { RequireAuth, RequireStaff } from './components/Guards.jsx'
import SiteLayout from './site/SiteLayout.jsx'
import Home from './site/pages/Home.jsx'
import { Courses, CoursePage, HowItWorks, Pricing, Placement, About, Contact, LevelTest } from './site/pages/Inner.jsx'
import { Login, Signup, ForgotPassword, UpdatePassword } from './pages/AuthPages.jsx'
import Hub from './pages/Hub.jsx'
import LessonPage from './pages/LessonPage.jsx'
import Admin from './pages/Admin.jsx'
import Progress from './pages/Progress.jsx'
import WordList from './pages/WordList.jsx'
import { Privacy, Terms } from './pages/Legal.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  if (!isConfigured) {
    return (
      <main className="page narrow">
        <h1>Configuration missing</h1>
        <p>VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Add them in Hostinger → Environment variables and redeploy.</p>
      </main>
    )
  }
  return (
    <Routes>
      {/* Public website */}
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/courses" element={<SiteLayout><Courses /></SiteLayout>} />
      <Route path="/courses/:lang" element={<SiteLayout><CoursePage /></SiteLayout>} />
      <Route path="/how-it-works" element={<SiteLayout><HowItWorks /></SiteLayout>} />
      <Route path="/pricing" element={<SiteLayout><Pricing /></SiteLayout>} />
      <Route path="/placement" element={<SiteLayout><Placement /></SiteLayout>} />
      <Route path="/level-test/:lang" element={<SiteLayout><LevelTest /></SiteLayout>} />
      <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
      <Route path="/contact" element={<SiteLayout><Contact /></SiteLayout>} />
      <Route path="/privacy" element={<SiteLayout plain><Privacy /></SiteLayout>} />
      <Route path="/terms" element={<SiteLayout plain><Terms /></SiteLayout>} />
      {/* Learning app */}
      <Route path="*" element={<AppShell />} />
    </Routes>
  )
}

function AppShell() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/learn" element={<RequireAuth><Hub /></RequireAuth>} />
        <Route path="/learn/progress" element={<RequireAuth><Progress /></RequireAuth>} />
        <Route path="/learn/lesson/:lessonId" element={<RequireAuth><LessonPage /></RequireAuth>} />
        <Route path="/learn/lesson/:lessonId/words" element={<RequireAuth><WordList /></RequireAuth>} />
        <Route path="/admin" element={<RequireStaff><Admin /></RequireStaff>} />
        <Route path="*" element={<main className="page narrow"><h1>Page not found</h1><p><a href="/">Go to the home page</a></p></main>} />
      </Routes>
      <Footer />
    </>
  )
}
