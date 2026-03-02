// ── FILE: frontend/src/App.jsx ──
import './index.css'
import { Routes, Route } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Compare from './pages/Compare'
import Analytics from './pages/Analytics'
import AIAdvisor from './pages/AIAdvisor'
import Recommender from './pages/Recommender'
import Automate from './pages/Automate'

export default function App() {
  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main style={{ paddingTop: 70, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/recommender" element={<Recommender />} />
          <Route path="/automate" element={<Automate />} />
          <Route path="*" element={<div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 18 }}>404 Not Found</div>} />
        </Routes>
      </main>
    </>
  )
}
