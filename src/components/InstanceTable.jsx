// ── FILE: frontend/src/components/InstanceTable.jsx ──
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

function monthlyPillStyle(monthly) {
  if (monthly < 50) return { color: '#10b981', background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '4px 8px' }
  if (monthly <= 150) return { color: '#f59e0b', background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '4px 8px' }
  return { color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '4px 8px' }
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
  'Oracle Cloud': '#f80000',
  Oracle: '#f80000',
  'IBM Cloud': '#0530ad',
  IBM: '#0530ad',
  Railway: '#8b5cf6',
  Cloudflare: '#f38020',
}

const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  overflow: 'hidden',
  maxHeight: 600,
  display: 'flex',
  flexDirection: 'column',
}
const tableWrap = { overflowY: 'auto', overflowX: 'auto', flex: 1 }
const rowBg = (i, providerName) => ({
  background: i % 2 === 0 ? 'rgba(15,15,35,0.4)' : 'rgba(13,13,31,0.4)',
  borderLeft: `3px solid ${PROVIDER_COLORS[providerName] ?? 'rgba(124,58,237,0.3)'}`,
})
const skeleton = {
  background: 'linear-gradient(90deg, #0d0d1f 25%, #1a1a3e 50%, #0d0d1f 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 8,
}
const syncedPill = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 11,
  color: '#64748b',
}
const emptyWrap = {
  height: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  color: '#64748b',
}

export default function InstanceTable({ instances = [], loading = false, selectable = false, selectedIds = new Set(), onToggleSelect }) {
  return (
    <div style={cardStyle}>
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
      <div style={tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {selectable && <th style={{ width: 48, padding: '14px 16px' }} />}
              <th>Provider</th>
              <th>Name</th>
              <th>CPU</th>
              <th>RAM</th>
              <th>Storage</th>
              <th>Region</th>
              <th>Hourly</th>
              <th>Monthly</th>
              <th>Yearly</th>
              <th>Synced</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {selectable && <td style={{ ...rowBg(i, ''), padding: 14 }}><div style={{ width: 18, height: 18, ...skeleton }} /></td>}
                    {[1,2,3,4,5,6,7,8,9,10].map((_, j) => (
                      <td key={j} style={rowBg(i, '')}>
                        <div style={{ height: 16, width: j === 1 ? 120 : 60, ...skeleton }} />
                      </td>
                    ))}
                  </tr>
                ))
              : instances.length === 0
                ? (
                    <tr>
                      <td colSpan={selectable ? 11 : 10} style={{ padding: 0, border: 'none', verticalAlign: 'middle' }}>
                        <div style={emptyWrap}>
                          <span style={{ fontSize: 48 }}>🔍</span>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>No instances match your filters</div>
                          <div>Try adjusting your search criteria</div>
                        </div>
                      </td>
                    </tr>
                  )
                : instances.map((inst, i) => (
                    <tr
                      key={inst.id}
                      style={{
                        animation: 'pageEnter 0.4s ease forwards',
                        animationDelay: `${i * 30}ms`,
                        opacity: 0,
                      }}
                    >
                      {selectable && (
                        <td style={{ ...rowBg(i, inst.provider?.name ?? ''), padding: '14px 16px' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(inst.id)}
                            onChange={() => onToggleSelect?.(inst.id)}
                            disabled={selectedIds.size >= 4 && !selectedIds.has(inst.id)}
                            style={{
                              width: 18,
                              height: 18,
                              accentColor: '#7c3aed',
                              cursor: 'pointer',
                            }}
                          />
                        </td>
                      )}
                      <td style={{ ...rowBg(i, inst.provider?.name ?? ''), padding: '14px 16px', fontWeight: 600 }}>
                        {inst.provider?.logo_url && (
                          <img src={inst.provider.logo_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', marginRight: 8 }} />
                        )}
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: PROVIDER_COLORS[inst.provider?.name] ?? '#7c3aed', display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
                        {inst.provider?.name ?? '—'}
                      </td>
                      <td style={{ ...rowBg(i, inst.provider?.name ?? ''), fontFamily: "'SF Mono', 'Fira Code', monospace", color: '#a78bfa' }}>{inst.name}</td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>{inst.cpu} <span style={{ color: '#64748b', fontSize: 12 }}>cores</span></td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>{inst.ram} <span style={{ color: '#64748b', fontSize: 12 }}>GB</span></td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>{inst.storage} <span style={{ color: '#64748b', fontSize: 12 }}>GB</span></td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>{inst.region}</td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>${inst.hourly_price?.toFixed(4)}</td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>
                        <span style={monthlyPillStyle(inst.monthly_price)}>${inst.monthly_price?.toFixed(2)}</span>
                      </td>
                      <td style={{ ...rowBg(i, inst.provider?.name ?? ''), color: '#64748b', fontSize: 13 }}>${inst.yearly_price?.toFixed(2)}</td>
                      <td style={rowBg(i, inst.provider?.name ?? '')}>
                        <span style={syncedPill}>{formatRelative(inst.last_synced)}</span>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
