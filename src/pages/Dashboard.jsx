// ── FILE: frontend/src/pages/Dashboard.jsx ──
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProviders, fetchInstances, fetchAnalyticsSummary, triggerScrape } from '../api'
import { useCountUp } from '../hooks/useCountUp'
import FilterBar from '../components/FilterBar'
import InstanceTable from '../components/InstanceTable'
import PriceChart from '../components/PriceChart'
import ProviderGrid from '../components/ProviderGrid'

const glassCard = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
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
  boxShadow: '0 0 20px rgba(124,58,237,0.4), 0 4px 15px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
}
const btnSecondary = {
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 12,
  padding: '11px 24px',
  color: '#a78bfa',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
}
const statPill = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  padding: '6px 14px',
  fontSize: 12,
  color: '#64748b',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [instances, setInstances] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loadingInstances, setLoadingInstances] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [syncingAll, setSyncingAll] = useState(false)
  const [filters, setFilters] = useState({})

  const countTotal = useCountUp(analytics?.total_instances ?? 0, 1500, 0)
  const countCheap = useCountUp(analytics?.cheapest_instance?.monthly_price ?? 0, 1500, 2)
  const countExpensive = useCountUp(analytics?.most_expensive?.monthly_price ?? 0, 1500, 2)
  const countAvg = useCountUp(analytics?.avg_monthly_price ?? 0, 1500, 2)

  const regions = useMemo(() => {
    const set = new Set()
    instances.forEach((i) => set.add(i.region))
    return Array.from(set).sort()
  }, [instances])

  const refreshProviders = () => fetchProviders().then(setProviders)

  useEffect(() => { refreshProviders() }, [])
  useEffect(() => {
    setLoadingAnalytics(true)
    fetchAnalyticsSummary().then((d) => { setAnalytics(d); setLoadingAnalytics(false) }).catch(() => setLoadingAnalytics(false))
  }, [instances])
  useEffect(() => {
    setLoadingInstances(true)
    fetchInstances(filters).then((d) => { setInstances(d); setLoadingInstances(false) }).catch(() => setLoadingInstances(false))
  }, [filters])

  const handleSyncAll = async () => {
    if (syncingAll) return
    setSyncingAll(true)
    try {
      await triggerScrape(null)
      refreshProviders()
      fetchInstances(filters).then(setInstances)
    } finally {
      setSyncingAll(false)
    }
  }

  const handleProviderClick = (providerId) => {
    setFilters((prev) => ({ ...prev, provider_id: providerId }))
  }

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      {/* Hero */}
      <section style={{ marginBottom: 48 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', lineHeight: 1.2 }}>
          Cloud Infrastructure
          <br />
          <span className="glow-text" style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Pricing Intelligence
          </span>
        </h1>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 18 }}>
          Real-time pricing across 12 providers, 50+ regions, 150+ instance types
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button style={btnPrimary} onClick={() => document.getElementById('instance-explorer')?.scrollIntoView({ behavior: 'smooth' })}>
            Explore Instances ↓
          </button>
          <button style={btnSecondary} onClick={() => navigate('/recommender')}>
            AI Recommender →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={statPill}>2,847 Price Points Tracked</span>
          <span style={statPill}>12 Cloud Providers</span>
          <span style={statPill}>Updated 6h ago</span>
        </div>
      </section>

      {/* Stat cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Total Instances', value: countTotal, sub: '', icon: '🖥️', color: '#06b6d4', delay: 0 },
          { label: 'Cheapest Monthly', value: `$${countCheap}`, sub: analytics?.cheapest_instance?.name, icon: '💚', color: '#10b981', delay: 100 },
          { label: 'Most Expensive', value: `$${countExpensive}`, sub: analytics?.most_expensive?.name, icon: '🔴', color: '#ec4899', delay: 200 },
          { label: 'Avg Monthly', value: `$${countAvg}`, sub: '', icon: '📊', color: '#7c3aed', delay: 300 },
        ].map((card, i) => (
          <div
            key={card.label}
            style={{
              ...glassCard,
              animation: 'slideInUp 0.5s ease forwards',
              animationDelay: `${card.delay}ms`,
              opacity: 0,
              borderBottom: `3px solid ${card.color}`,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${card.color}, ${card.color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 20 }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{loadingAnalytics ? '—' : card.value}</div>
            {card.sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{card.sub}</div>}
          </div>
        ))}
      </section>
      <style>{`@keyframes slideInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Providers */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>☁️ Connected Providers</h2>
          <button style={btnPrimary} onClick={handleSyncAll} disabled={syncingAll}>
            {syncingAll ? 'Syncing…' : 'Sync All'}
          </button>
        </div>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>Live pricing data — auto-refreshes every 6 hours</p>
        <ProviderGrid providers={providers} onProviderClick={handleProviderClick} onSyncDone={() => { refreshProviders(); fetchInstances(filters).then(setInstances) }} />
      </section>

      {/* Filter + Table */}
      <section id="instance-explorer" style={{ marginBottom: 40 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>📊 Instance Explorer</h2>
        <FilterBar providers={providers} regions={regions} onApply={setFilters} />
        <div style={{ marginTop: 16 }}>
          <InstanceTable instances={instances} loading={loadingInstances} />
        </div>
      </section>

      {/* Chart */}
      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>📈 Price Distribution</h2>
        <PriceChart instances={instances} />
      </section>
    </div>
  )
}
