// ── FILE: frontend/src/components/PriceChart.jsx ──
import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function PriceChart({ instances = [] }) {
  const [visible, setVisible] = useState(false)
  const [animationBegin, setAnimationBegin] = useState(1)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          setAnimationBegin(0)
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const byProvider = {}
  instances.forEach((inst) => {
    const name = inst.provider?.name ?? 'Unknown'
    if (!byProvider[name]) byProvider[name] = { name, prices: [] }
    byProvider[name].prices.push(inst.monthly_price)
  })
  const data = Object.entries(byProvider).map(([name, o]) => ({
    provider: name,
    avg: o.prices.length ? Number((o.prices.reduce((a, b) => a + b, 0) / o.prices.length).toFixed(2)) : 0,
    min: Number(Math.min(...o.prices).toFixed(2)),
    max: Number(Math.max(...o.prices).toFixed(2)),
  }))

  const tooltipStyle = {
    background: 'rgba(15,15,35,0.95)',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 12,
    color: '#f1f5f9',
    padding: 12,
  }

  return (
    <div ref={ref} style={cardStyle}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>Price Distribution by Provider</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Average, minimum and maximum monthly cost</div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" vertical={false} />
          <XAxis dataKey="provider" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
            cursor={{ fill: 'rgba(124,58,237,0.05)' }}
          />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar dataKey="avg" fill="#7c3aed" name="Avg $/mo" radius={[4, 4, 0, 0]} animationBegin={animationBegin} animationDuration={1500} />
          <Bar dataKey="min" fill="#10b981" name="Min $/mo" radius={[4, 4, 0, 0]} animationBegin={animationBegin} animationDuration={1500} />
          <Bar dataKey="max" fill="#ec4899" name="Max $/mo" radius={[4, 4, 0, 0]} animationBegin={animationBegin} animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
