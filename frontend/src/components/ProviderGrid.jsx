// ── FILE: frontend/src/components/ProviderGrid.jsx ──
import { useState } from 'react'
import { triggerScrape } from '../api'

function formatRelative(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const s = Math.floor((now - d) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const PROVIDER_COLORS = {
  AWS: '#f97316',
  Azure: '#3b82f6',
  GCP: '#22c55e',
  DigitalOcean: '#0080ff',
  Hetzner: '#d50c2d',
  Linode: '#02b159',
  Vultr: '#009bde',
  OVHcloud: '#123f6d',
  Oracle: '#f80000',
  IBM: '#0530ad',
  Railway: '#8b5cf6',
  Cloudflare: '#f38020',
}

const cardBase = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  cursor: 'pointer',
}

const statusStyle = (status) => {
  if (status === 'success') return { color: '#10b981' }
  if (status === 'fallback') return { color: '#f59e0b' }
  if (status === 'error') return { color: '#ef4444' }
  return { color: '#64748b' }
}
const statusLabel = (status) => {
  if (status === 'success') return '● LIVE'
  if (status === 'fallback') return '● VERIFIED'
  if (status === 'error') return '● ERROR'
  return '● —'
}

export default function ProviderGrid({ providers = [], onProviderClick, onSyncDone }) {
  const [syncing, setSyncing] = useState(null)

  const handleSync = async (e, providerName) => {
    e.stopPropagation()
    if (syncing) return
    setSyncing(providerName)
    try {
      await triggerScrape(providerName)
      onSyncDone?.()
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      {providers.map((p) => {
        const accent = PROVIDER_COLORS[p.name] ?? '#7c3aed'
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onProviderClick?.(p.id)}
            onKeyDown={(e) => e.key === 'Enter' && onProviderClick?.(p.id)}
            style={{
              ...cardBase,
              borderLeft: `3px solid ${accent}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accent}4D`
              e.currentTarget.style.boxShadow = `0 0 0 1px rgba(124,58,237,0.2), 0 8px 32px ${accent}4D, inset 0 1px 0 rgba(255,255,255,0.08)`
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.15)'
              e.currentTarget.style.borderLeftColor = accent
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {p.logo_url && <img src={p.logo_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
              </div>
              <span style={{ fontSize: 11, ...statusStyle(p.scrape_status), animation: p.scrape_status === 'success' ? 'pulse 2s ease-in-out infinite' : undefined }}>
                {statusLabel(p.scrape_status)}
              </span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {p.instance_count ?? 0}
              </span>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>instances</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {(p.regions || []).slice(0, 3).map((r) => (
                <span
                  key={r}
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                  }}
                >
                  {r}
                </span>
              ))}
              {(p.regions?.length ?? 0) > 3 && <span style={{ fontSize: 11, color: '#64748b' }}>+{(p.regions?.length ?? 0) - 3}</span>}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{formatRelative(p.last_scraped)}</div>
            <button
              type="button"
              onClick={(e) => handleSync(e, p.name)}
              disabled={syncing != null}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.1)',
                color: '#a78bfa',
                fontSize: 12,
                fontWeight: 500,
                cursor: syncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {syncing === p.name ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
