// ── FILE: frontend/src/pages/Analytics.jsx ──
import { useState, useEffect } from 'react'
import { fetchAnalyticsSummary, fetchForecast, fetchInstances, fetchInstanceHistory } from '../api'
import SavingsCard from '../components/SavingsCard'
import ForecastChart from '../components/ForecastChart'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'

const glassCard = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const providerBorder = {
  AWS: '#f97316', Azure: '#3b82f6', GCP: '#22c55e', DigitalOcean: '#0080ff',
  Hetzner: '#d50c2d', Linode: '#02b159', Vultr: '#009bde', OVHcloud: '#123f6d',
  Oracle: '#f80000', IBM: '#0530ad', Railway: '#8b5cf6', Cloudflare: '#f38020',
}

const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#a78bfa', '#f97316', '#3b82f6', '#22c55e', '#0080ff', '#d50c2d', '#02b159']

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [instances, setInstances] = useState([])
  const [forecastInstanceId, setForecastInstanceId] = useState('')
  const [forecast, setForecast] = useState(null)
  const [historyInstanceId, setHistoryInstanceId] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchAnalyticsSummary().then(setAnalytics).catch(() => {})
    fetchInstances({}).then(setInstances).catch(() => {})
  }, [])

  useEffect(() => {
    if (!forecastInstanceId) { setForecast(null); return }
    fetchForecast(Number(forecastInstanceId)).then(setForecast).catch(() => setForecast(null))
  }, [forecastInstanceId])

  useEffect(() => {
    if (!historyInstanceId) { setHistory([]); return }
    fetchInstanceHistory(historyInstanceId).then((data) => setHistory((data || []).slice().reverse())).catch(() => setHistory([]))
  }, [historyInstanceId])

  const pieData = analytics?.provider_breakdown?.map((b) => ({ name: b.provider.name, value: b.count })) ?? []
  const tooltipStyle = { background: 'rgba(15,15,35,0.95)', border: '1px solid rgba(124,58,237,0.3)', color: '#f1f5f9', borderRadius: 12, padding: 12 }
  const historyChartData = history.map((h) => ({ recorded_at: new Date(h.recorded_at).toLocaleDateString(), price: h.hourly_price * 24 * 30 }))

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800 }}>Cost Analytics</h1>

      {/* Provider breakdown row - scrollable */}
      <div style={{ overflowX: 'auto', marginBottom: 24, display: 'flex', gap: 16, paddingBottom: 8, scrollbarWidth: 'none' }}>
        <style>{`div.analytics-provider-row::-webkit-scrollbar { display: none; }`}</style>
        <div className="analytics-provider-row" style={{ display: 'flex', gap: 16, minWidth: 'max-content' }}>
          {analytics?.provider_breakdown?.map((b) => (
            <div
              key={b.provider.id}
              style={{ ...glassCard, minWidth: 200, borderTop: `3px solid ${providerBorder[b.provider.name] || '#7c3aed'}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {b.provider.logo_url && <img src={b.provider.logo_url} alt="" style={{ width: 32, height: 32 }} />}
                <span style={{ fontWeight: 700 }}>{b.provider.name}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>Count: {b.count}</div>
              <div>Avg $/mo: <strong style={{ color: '#a78bfa' }}>${b.avg_monthly?.toFixed(2)}</strong></div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Min: ${b.min_monthly?.toFixed(2)} · Max: ${b.max_monthly?.toFixed(2)}</div>
              <svg width="100%" height="24" style={{ marginTop: 8 }}>
                {[b.min_monthly, (b.min_monthly + b.max_monthly) / 2, b.max_monthly].map((_, i) => (
                  <circle key={i} cx={20 + i * 30} cy={12} r={3} fill={COLORS[i]} opacity={0.8} />
                ))}
                <line x1="20" y1="12" x2="80" y2="12" stroke="rgba(124,58,237,0.3)" strokeWidth="1" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <SavingsCard analytics={analytics} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={glassCard}>
          <h3 style={{ margin: '0 0 16px' }}>Instances by provider</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={(e) => `${e.name} (${e.value})`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(15,15,35,0.6)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: -120, fontSize: 28, fontWeight: 800, color: '#f1f5f9', pointerEvents: 'none' }}>{analytics?.total_instances ?? 0}+</div>
          <div style={{ textAlign: 'center', marginTop: -116, fontSize: 12, color: '#64748b', pointerEvents: 'none' }}>Instances</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Price Forecast</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Based on historical pricing trends</p>
        <select
          value={forecastInstanceId}
          onChange={(e) => setForecastInstanceId(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
        >
          <option value="">Select instance</option>
          {instances.map((i) => (
            <option key={i.id} value={i.id}>{i.provider?.name} — {i.name}</option>
          ))}
        </select>
        <ForecastChart forecast={forecast} />
      </div>

      <div>
        <h3 style={{ marginBottom: 12 }}>Price History</h3>
        <select
          value={historyInstanceId}
          onChange={(e) => setHistoryInstanceId(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
        >
          <option value="">Select instance</option>
          {instances.map((i) => (
            <option key={i.id} value={i.id}>{i.provider?.name} — {i.name}</option>
          ))}
        </select>
        {historyChartData.length > 0 ? (
          <div style={glassCard}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={historyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.3)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" vertical={false} />
                <XAxis dataKey="recorded_at" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Monthly']} />
                <Area type="monotone" dataKey="price" stroke="#7c3aed" strokeWidth={2} fill="url(#historyGrad)" dot={{ r: 4, fill: '#7c3aed', stroke: '#ec4899' }} activeDot={{ r: 6, filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.8))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ color: '#64748b', padding: 24, ...glassCard }}>Select an instance to see price history.</div>
        )}
      </div>
    </div>
  )
}
