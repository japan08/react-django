// ── FILE: frontend/src/components/FilterBar.jsx ──
import { useState } from 'react'

const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
}

const row = { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }
const labelStyle = {
  color: '#64748b',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: 6,
}
const inputStyle = {
  background: 'rgba(13,13,31,0.8)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#f1f5f9',
  fontSize: 14,
  minWidth: 90,
}
const btnPrimary = {
  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
  border: 'none',
  borderRadius: 12,
  padding: '12px 24px',
  color: 'white',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  boxShadow: '0 0 20px rgba(124,58,237,0.4), 0 4px 15px rgba(0,0,0,0.3)',
}
const btnSecondary = {
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 12,
  padding: '11px 24px',
  color: '#a78bfa',
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
}
const pillStyle = {
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 20,
  padding: '4px 12px',
  fontSize: 12,
  color: '#a78bfa',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
}
const badgeCircle = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 20,
  height: 20,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
  color: 'white',
  fontSize: 11,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default function FilterBar({ providers = [], regions = [], onApply }) {
  const [minCpu, setMinCpu] = useState('')
  const [minRam, setMinRam] = useState('')
  const [providerId, setProviderId] = useState('')
  const [region, setRegion] = useState('')
  const [maxMonthly, setMaxMonthly] = useState('')

  const filters = {
    min_cpu: minCpu ? Number(minCpu) : null,
    min_ram: minRam ? Number(minRam) : null,
    provider_id: providerId ? Number(providerId) : null,
    region: region || null,
    max_monthly_price: maxMonthly ? Number(maxMonthly) : null,
  }
  const activeCount = [
    filters.min_cpu != null,
    filters.min_ram != null,
    filters.provider_id != null,
    !!filters.region,
    filters.max_monthly_price != null,
  ].filter(Boolean).length

  const activePills = []
  if (filters.min_cpu != null) activePills.push({ key: 'min_cpu', label: `CPU ≥ ${filters.min_cpu}`, clear: () => setMinCpu('') })
  if (filters.min_ram != null) activePills.push({ key: 'min_ram', label: `RAM ≥ ${filters.min_ram} GB`, clear: () => setMinRam('') })
  if (filters.provider_id != null) {
    const p = providers.find((x) => x.id === filters.provider_id)
    activePills.push({ key: 'provider', label: p?.name || 'Provider', clear: () => setProviderId('') })
  }
  if (filters.region) activePills.push({ key: 'region', label: filters.region, clear: () => setRegion('') })
  if (filters.max_monthly_price != null) activePills.push({ key: 'max', label: `≤ $${filters.max_monthly_price}/mo`, clear: () => setMaxMonthly('') })

  const handleApply = () => onApply(filters)
  const handleReset = () => {
    setMinCpu('')
    setMinRam('')
    setProviderId('')
    setRegion('')
    setMaxMonthly('')
    onApply({})
  }

  return (
    <div style={cardStyle}>
      <div style={row}>
        <div>
          <div style={labelStyle}>Min CPU</div>
          <input
            type="number"
            min={0}
            value={minCpu}
            onChange={(e) => setMinCpu(e.target.value)}
            placeholder="Any"
            style={{ ...inputStyle, width: 90 }}
          />
        </div>
        <div>
          <div style={labelStyle}>Min RAM (GB)</div>
          <input
            type="number"
            min={0}
            value={minRam}
            onChange={(e) => setMinRam(e.target.value)}
            placeholder="Any"
            style={{ ...inputStyle, width: 90 }}
          />
        </div>
        <div>
          <div style={labelStyle}>Provider</div>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            style={{ ...inputStyle, minWidth: 140 }}
          >
            <option value="">All</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Region</div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{ ...inputStyle, minWidth: 140 }}
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Max $/month</div>
          <input
            type="number"
            min={0}
            step={0.01}
            value={maxMonthly}
            onChange={(e) => setMaxMonthly(e.target.value)}
            placeholder="Any"
            style={{ ...inputStyle, width: 110 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            type="button"
            style={{ ...btnPrimary, position: 'relative' }}
            onClick={handleApply}
          >
            Apply
            {activeCount > 0 && <span style={badgeCircle}>{activeCount}</span>}
          </button>
          <button type="button" style={btnSecondary} onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
      {activePills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {activePills.map(({ key, label, clear }) => (
            <span key={key} style={pillStyle} onClick={clear} role="button" tabIndex={0}>
              {label} ✕
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
