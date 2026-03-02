// ── FILE: frontend/src/components/RecommendationCards.jsx ──
import { useNavigate } from 'react-router-dom'

function ScoreRing({ score, verdict }) {
  const clamped = Math.min(100, Math.max(0, score))
  const color = clamped > 80 ? '#10b981' : clamped >= 60 ? '#f59e0b' : '#ef4444'
  const r = 26
  const c = 2 * Math.PI * r
  const dash = (clamped / 100) * c
  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={30} cy={30} r={r} fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth={4} />
        <circle
          cx={30}
          cy={30}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
        {Math.round(clamped)}%
      </div>
    </div>
  )
}

function VerdictBadge({ verdict }) {
  const style =
    verdict === 'Best Value'
      ? { background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white' }
      : verdict === 'Best Performance'
        ? { background: 'linear-gradient(135deg, #ef4444, #f59e0b)', color: 'white' }
        : { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white' }
  const icon = verdict === 'Best Value' ? '🏆' : verdict === 'Best Performance' ? '⚡' : '⚖️'
  return (
    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, ...style }}>
      {icon} {verdict}
    </span>
  )
}

const cardBase = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  transition: 'all 0.25s ease',
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}

export default function RecommendationCards({ recommendations = [] }) {
  const navigate = useNavigate()

  if (!recommendations.length) return null

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {recommendations.map((rec, index) => {
        const inst = rec.instance
        const isMiddle = index === 1
        return (
          <div
            key={inst?.id ?? index}
            style={{
              ...cardBase,
              animation: 'pageEnter 0.5s ease forwards',
              animationDelay: `${index * 150}ms`,
              opacity: 0,
              ...(isMiddle
                ? {
                    transform: 'scale(1.02)',
                    border: '1px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 0 0 1px rgba(124,58,237,0.2), 0 0 60px rgba(124,58,237,0.2)',
                    position: 'relative',
                  }
                : {}),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'
              e.currentTarget.style.transform = isMiddle ? 'translateY(-4px) scale(1.02)' : 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isMiddle ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.15)'
              e.currentTarget.style.transform = isMiddle ? 'scale(1.02)' : 'translateY(0)'
            }}
          >
            {isMiddle && (
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  color: 'white',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontWeight: 700,
                }}
              >
                RECOMMENDED
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <VerdictBadge verdict={rec.verdict} />
              <ScoreRing score={rec.match_score} verdict={rec.verdict} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {inst?.provider?.logo_url && <img src={inst.provider.logo_url} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>{inst?.provider?.name ?? '—'}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{inst?.name ?? '—'}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>🖥️ {inst?.cpu ?? 0} cores</span>
              <span style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>💾 {inst?.ram ?? 0} GB</span>
              <span style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>💿 {inst?.storage ?? 0} GB</span>
              <span style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>🌍 {inst?.region ?? '—'}</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 28, fontWeight: 700 }}>${inst?.monthly_price?.toFixed(2) ?? '0'}/mo</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>${inst?.hourly_price?.toFixed(4) ?? '0'}/hr · ~${inst?.yearly_price?.toFixed(2) ?? '0'}/yr</div>
            </div>
            <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: 13, marginBottom: 16, borderLeft: '2px solid rgba(124,58,237,0.3)', paddingLeft: 12 }}>{rec.use_case_fit}</div>
            <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', letterSpacing: '0.05em', marginBottom: 6 }}>✅ WHY IT WORKS</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#10b981', fontSize: 13, lineHeight: 1.8 }}>
                {(rec.pros || []).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div style={{ borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(239,68,68,0.9)', letterSpacing: '0.05em', marginBottom: 6 }}>⚠️ CONSIDER THIS</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(239,68,68,0.7)', fontSize: 13, lineHeight: 1.8 }}>
                {(rec.cons || []).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/compare?highlight=${inst?.id ?? ''}`)}
              style={{
                marginTop: 'auto',
                width: '100%',
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#a78bfa',
                borderRadius: 12,
                padding: '10px 20px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s ease',
              }}
            >
              View Details →
            </button>
          </div>
        )
      })}
    </div>
  )
}
