// ── FILE: frontend/src/pages/Compare.jsx ──
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchInstances, fetchSavedComparisons, saveComparison } from '../api'
import InstanceTable from '../components/InstanceTable'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const glassCard = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const PROVIDER_COLORS = {
  AWS: '#f97316', Azure: '#3b82f6', GCP: '#22c55e', DigitalOcean: '#0080ff',
  Hetzner: '#d50c2d', Linode: '#02b159', Vultr: '#009bde', OVHcloud: '#123f6d',
  Oracle: '#f80000', IBM: '#0530ad', Railway: '#8b5cf6', Cloudflare: '#f38020',
}

export default function Compare() {
  const [searchParams] = useSearchParams()
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saved, setSaved] = useState([])
  const [compareName, setCompareName] = useState('')
  const [expandedSaved, setExpandedSaved] = useState(null)

  useEffect(() => {
    const minCpu = searchParams.get('min_cpu')
    const minRam = searchParams.get('min_ram')
    fetchInstances({
      min_cpu: minCpu ? Number(minCpu) : null,
      min_ram: minRam ? Number(minRam) : null,
    }).then((d) => { setInstances(d); setLoading(false) }).catch(() => setLoading(false))
  }, [searchParams])

  useEffect(() => {
    fetchSavedComparisons().then(setSaved).catch(() => {})
  }, [])

  const selected = instances.filter((i) => selectedIds.has(i.id))
  const cheapestId = selected.length ? selected.reduce((a, b) => (a.monthly_price < b.monthly_price ? a : b)).id : null
  const expensiveId = selected.length ? selected.reduce((a, b) => (a.monthly_price > b.monthly_price ? a : b)).id : null

  const onToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  const handleSave = () => {
    const name = compareName.trim() || window.prompt('Name this comparison')
    if (!name || selectedIds.size < 2) return
    saveComparison(name, [...selectedIds]).then(() => {
      fetchSavedComparisons().then(setSaved)
      setCompareName('')
    })
  }

  const barData = selected.map((i) => ({
    name: i.name,
    cpu: i.cpu,
    ram: i.ram,
    monthly: i.monthly_price,
    fill: PROVIDER_COLORS[i.provider?.name] ?? '#7c3aed',
  }))

  return (
    <div className="page-enter compare-layout" style={{ padding: 24, maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 24, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Select instances to compare</h1>
          <span
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Up to 4 selected
          </span>
          {selectedIds.size > 0 && <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>{selectedIds.size} selected</span>}
        </div>
        <InstanceTable instances={instances} loading={loading} selectable selectedIds={selectedIds} onToggleSelect={onToggleSelect} />
      </div>

      <div style={{ position: 'sticky', top: 90 }}>
        <div style={glassCard}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Comparison View</h3>
          {selected.length >= 2 && selected.length <= 4 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {selected.map((inst) => (
                  <div
                    key={inst.id}
                    style={{
                      ...glassCard,
                      padding: 16,
                      borderLeft: `4px solid ${inst.id === cheapestId ? '#10b981' : inst.id === expensiveId ? '#ef4444' : 'rgba(124,58,237,0.3)'}`,
                    }}
                  >
                    {inst.id === cheapestId && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>💚 Best Value</span>}
                    {inst.id === expensiveId && inst.id !== cheapestId && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>⚠️ Most Expensive</span>}
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{inst.provider?.name} · {inst.name}</div>
                    <div style={{ marginTop: 8 }}>CPU: {inst.cpu} · RAM: {inst.ram} GB · Storage: {inst.storage} GB</div>
                    <div style={{ marginTop: 8, fontWeight: 600 }}>${inst.monthly_price?.toFixed(2)}/mo</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" />
                  <XAxis type="number" stroke="#64748b" tickFormatter={(v) => (v > 100 ? `$${v}` : v)} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,35,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, color: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="cpu" fill="#7c3aed" name="CPU" />
                  <Bar dataKey="ram" fill="#10b981" name="RAM (GB)" />
                  <Bar dataKey="monthly" fill="#ec4899" name="$/month" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Comparison name</label>
                <input
                  value={compareName}
                  onChange={(e) => setCompareName(e.target.value)}
                  placeholder="e.g. Web tier comparison"
                  style={{ marginBottom: 8 }}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 24px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Save Comparison
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                border: '2px dashed rgba(124,58,237,0.3)',
                borderRadius: 20,
                padding: 48,
                textAlign: 'center',
                color: '#64748b',
                animation: 'bounceArrow 2s ease-in-out infinite',
              }}
            >
              <style>{`@keyframes bounceArrow { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-8px)} }`}</style>
              ← Select 2-4 instances
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Saved comparisons</h3>
          {saved.map((c) => (
            <div key={c.id} style={{ ...glassCard, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
                    onClick={() => setExpandedSaved(expandedSaved === c.id ? null : c.id)}
                  >
                    Load
                  </button>
                </div>
              </div>
            </div>
          ))}
          {saved.length === 0 && <span style={{ color: '#64748b', fontSize: 14 }}>None yet.</span>}
        </div>
      </div>
    </div>
  )
}
