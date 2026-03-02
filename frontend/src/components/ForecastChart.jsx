// ── FILE: frontend/src/components/ForecastChart.jsx ──
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function ForecastChart({ forecast }) {
  if (!forecast?.forecast?.length) return <div style={{ ...cardStyle, color: '#64748b', padding: 24 }}>Select an instance to see forecast.</div>

  const currentPrice = forecast.forecast[0]?.cost ?? 0
  const tooltipStyle = { background: 'rgba(15,15,35,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, color: '#f1f5f9', padding: 12 }

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 16 }}>{forecast.instance_name} — 12‑month projection</div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={forecast.forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124,58,237,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" vertical={false} />
          <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#64748b" tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Projected']}
            labelFormatter={(l) => l}
          />
          <ReferenceLine y={currentPrice} stroke="#ec4899" strokeDasharray="6 3" label={{ value: `Current: $${currentPrice}`, fill: '#ec4899', fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#forecastGrad)"
            dot={{ r: 5, fill: '#7c3aed', stroke: '#ec4899', strokeWidth: 2 }}
            activeDot={{ r: 8, fill: '#7c3aed', stroke: '#ec4899', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.8))' }}
            animationBegin={0}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
