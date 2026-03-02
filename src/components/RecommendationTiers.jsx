import { useNavigate } from 'react-router-dom'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

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
  minWidth: 280,
  display: 'flex',
  flexDirection: 'column',
}

const TIER_STYLES = {
  'Top Pick': {
    border: '1px solid rgba(16,185,129,0.5)',
    boxShadow: '0 0 0 1px rgba(16,185,129,0.2), 0 0 40px rgba(16,185,129,0.15)',
    badge: { background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white' },
  },
  'Budget Option': {
    border: '1px solid rgba(124,58,237,0.3)',
    badge: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' },
  },
  'Performance Option': {
    border: '1px solid rgba(245,158,11,0.4)',
    badge: { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
  },
  'Growth Path': {
    border: '1px solid rgba(6,182,212,0.4)',
    badge: { background: 'rgba(6,182,212,0.2)', color: '#06b6d4' },
  },
}

function ScoreRadar({ scoreBreakdown }) {
  const data = [
    { subject: 'Cost', value: scoreBreakdown?.cost ?? 0, fullMark: 100 },
    { subject: 'Perf', value: scoreBreakdown?.performance ?? 0, fullMark: 100 },
    { subject: 'Rel', value: scoreBreakdown?.reliability ?? 0, fullMark: 100 },
    { subject: 'Value', value: scoreBreakdown?.value ?? 0, fullMark: 100 },
    { subject: 'Scale', value: scoreBreakdown?.scalability ?? 0, fullMark: 100 },
  ]
  return (
    <ResponsiveContainer width="100%" height={140}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(124,58,237,0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#7c3aed"
          fill="#7c3aed"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip contentStyle={{ background: '#0f0f23', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8 }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default function RecommendationTiers({ tiers, costProjection, onCompare }) {
  const navigate = useNavigate()

  if (!tiers?.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {costProjection && (
        <div
          style={{
            background: 'rgba(124,58,237,0.08)',
            borderLeft: '4px solid #7c3aed',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Monthly</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>${costProjection.monthly_cost?.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Annual</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#a78bfa' }}>${costProjection.annual_cost?.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>3-Year</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#a78bfa' }}>${costProjection.three_year_cost?.toFixed(2)}</div>
          </div>
          {costProjection.potential_savings_vs_budget && (
            <div>
              <div style={{ fontSize: 12, color: '#10b981', marginBottom: 4 }}>Savings vs budget</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>{costProjection.potential_savings_vs_budget}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {tiers.map((tier, index) => {
          const style = TIER_STYLES[tier.tier_name] || {}
          const isTopPick = tier.tier_name === 'Top Pick'
          return (
            <div
              key={`${tier.instance_id}-${tier.tier_name}-${index}`}
              style={{
                ...cardBase,
                ...(isTopPick ? { transform: 'scale(1.02)' } : {}),
                border: style.border || cardBase.border,
                boxShadow: style.boxShadow || cardBase.boxShadow,
                animation: 'pageEnter 0.5s ease forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0,
              }}
            >
              {isTopPick && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    ...style.badge,
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontWeight: 700,
                  }}
                >
                  🏆 TOP PICK
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    ...(style.badge || {}),
                  }}
                >
                  {tier.tier_name}
                </span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>{tier.provider}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', fontFamily: "'SF Mono', monospace" }}>
                  {tier.instance_name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{tier.region}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span style={{ background: 'rgba(124,58,237,0.08)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                  {tier.cpu} vCPU
                </span>
                <span style={{ background: 'rgba(124,58,237,0.08)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                  {tier.ram} GB RAM
                </span>
                <span style={{ background: 'rgba(124,58,237,0.08)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                  {tier.storage} GB
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  ${tier.monthly_price?.toFixed(2)}/mo
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  ${tier.hourly_price?.toFixed(4)}/hr · ~${tier.annual_price?.toFixed(2)}/yr
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontStyle: 'italic' }}>
                {tier.why_recommended}
              </div>
              <div style={{ marginBottom: 12, height: 120 }}>
                <ScoreRadar scoreBreakdown={tier.score_breakdown} />
              </div>
              {tier.upgrade_path?.length > 0 && (
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, color: '#06b6d4' }}>Upgrade path:</span>{' '}
                  {tier.upgrade_path.slice(0, 2).join(' → ')}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/compare?highlight=${tier.instance_id}`)}
                  style={{
                    flex: 1,
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    color: '#a78bfa',
                    borderRadius: 12,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Compare
                </button>
                <button
                  type="button"
                  onClick={() => onCompare?.([tier.instance_id])}
                  style={{
                    flex: 1,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981',
                    borderRadius: 12,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
