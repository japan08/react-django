// ── FILE: frontend/src/components/SavingsCard.jsx ──
const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  borderLeft: '4px solid transparent',
  borderImage: 'linear-gradient(135deg, #10b981, #06b6d4) 1',
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  flexWrap: 'wrap',
}

export default function SavingsCard({ analytics }) {
  if (!analytics?.cheapest_instance || !analytics?.most_expensive) return null
  const cheap = analytics.cheapest_instance
  const expensive = analytics.most_expensive
  const saveMonth = (expensive.monthly_price - cheap.monthly_price).toFixed(2)
  const saveYear = (expensive.yearly_price - cheap.yearly_price).toFixed(2)
  const pct = expensive.monthly_price > 0 ? (cheap.monthly_price / expensive.monthly_price) * 100 : 0

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          💡
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Potential Savings</div>
          <div
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            ${Number(saveYear).toLocaleString()}/yr
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>by switching to a cheaper alternative</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 12, flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 12, color: '#10b981' }}>Cheapest</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{cheap.name}</div>
            <div style={{ fontSize: 14, color: '#10b981' }}>${cheap.monthly_price?.toFixed(2)}/mo</div>
          </div>
          <span style={{ color: '#64748b', fontSize: 14 }}>→</span>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 12, color: '#ef4444' }}>Most expensive</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{expensive.name}</div>
            <div style={{ fontSize: 14, color: '#ef4444' }}>${expensive.monthly_price?.toFixed(2)}/mo</div>
          </div>
          <span style={{ fontWeight: 700, color: '#10b981' }}>Save ${saveMonth}/mo</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              borderRadius: 4,
              boxShadow: '0 0 12px rgba(16,185,129,0.5)',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
