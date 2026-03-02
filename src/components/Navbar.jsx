// ── FILE: frontend/src/components/Navbar.jsx ──
import { NavLink } from 'react-router-dom'
import AIProviderToggle from './AIProviderToggle'

const navStyle = {
  height: 70,
  background: 'rgba(2,2,8,0.85)',
  backdropFilter: 'blur(30px) saturate(200%)',
  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
  borderBottom: '1px solid rgba(124,58,237,0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
}

const logoWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const logoText = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}
const logoGradient = {
  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: '-0.03em',
}
const badge = {
  fontSize: 9,
  letterSpacing: '0.15em',
  color: '#7c3aed',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 4,
  padding: '1px 6px',
  alignSelf: 'flex-start',
}

const statusRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}
const statusPill = (color) => ({
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  padding: '4px 12px',
  fontSize: 11,
  color,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
})
const liveDot = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#10b981',
  animation: 'pulse 2s ease-in-out infinite',
}
const rightSection = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
}
const linkGroup = { display: 'flex', gap: 6, alignItems: 'center' }
const baseLink = {
  color: '#64748b',
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: 10,
  fontWeight: 500,
  fontSize: 13,
  transition: 'all 0.3s ease',
}
const activeLink = {
  ...baseLink,
  background: 'rgba(124,58,237,0.15)',
  border: '1px solid rgba(124,58,237,0.3)',
  color: '#a78bfa',
  boxShadow: '0 0 20px rgba(124,58,237,0.15)',
}
const recommenderLink = {
  ...baseLink,
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.3)',
  color: '#a78bfa',
  boxShadow: '0 0 15px rgba(124,58,237,0.2)',
}

export default function Navbar() {
  return (
    <nav style={navStyle}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <div style={logoWrap}>
        <div style={logoText}>
          <span style={logoGradient}>⚡</span>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20 }}>CloudPrice</span>
        </div>
        <span style={badge}>v2.0 FUTURISTIC EDITION</span>
      </div>

      <div style={statusRow}>
        <span style={statusPill('#10b981')}>
          <span style={liveDot} />
          LIVE
        </span>
        <span style={statusPill('#06b6d4')}>12 PROVIDERS</span>
        <span style={statusPill('#a78bfa')}>150+ INSTANCES</span>
      </div>

      <div style={rightSection} data-ai-toggle>
        <AIProviderToggle />
        <div style={linkGroup}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => (isActive ? activeLink : baseLink)}
          >
            Dashboard
          </NavLink>
          <NavLink to="/compare" style={({ isActive }) => (isActive ? activeLink : baseLink)}>
            Compare
          </NavLink>
          <NavLink to="/analytics" style={({ isActive }) => (isActive ? activeLink : baseLink)}>
            Analytics
          </NavLink>
          <NavLink to="/ai-advisor" style={({ isActive }) => (isActive ? activeLink : baseLink)}>
            AI Advisor
          </NavLink>
          <NavLink
            to="/automate"
            style={({ isActive }) => (isActive ? { ...recommenderLink, background: 'rgba(124,58,237,0.2)', color: '#fff' } : recommenderLink)}
          >
            🚀 Quick Recommend
          </NavLink>
          <NavLink
            to="/recommender"
            style={({ isActive }) => (isActive ? { ...recommenderLink, background: 'rgba(124,58,237,0.2)', color: '#fff' } : recommenderLink)}
          >
            🎯 AI Recommender
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
