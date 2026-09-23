import { Routes, Route } from 'react-router-dom'
import { isConfigured } from './lib/supabase.js'
import Header from './components/Header.jsx'
import { RequireAuth, RequireStaff } from './components/Guards.jsx'
import Landing from './pages/Landing.jsx'
import { Login, Signup, ForgotPassword, UpdatePassword } from './pages/AuthPages.jsx'
import Hub from './pages/Hub.jsx'
import LessonPage from './pages/LessonPage.jsx'
import Admin from './pages/Admin.jsx'
import Progress from './pages/Progress.jsx'
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
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/learn" element={<RequireAuth><Hub /></RequireAuth>} />
        <Route path="/learn/progress" element={<RequireAuth><Progress /></RequireAuth>} />
        <Route path="/learn/lesson/:lessonId" element={<RequireAuth><LessonPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireStaff><Admin /></RequireStaff>} />
        <Route path="*" element={<main className="page narrow"><h1>Page not found</h1><p><a href="/">Go to the home page</a></p></main>} />
      </Routes>
      <Footer />
    </>
  )
}
