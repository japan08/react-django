import { useState } from 'react'

const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const WORKLOAD_OPTIONS = [
  { id: 'web_app', label: '🌐 Web App / API' },
  { id: 'database', label: '🗄️ Database' },
  { id: 'ml_gpu', label: '🤖 ML / GPU' },
  { id: 'data_processing', label: '📊 Data Processing' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'media_streaming', label: '📺 Media Streaming' },
  { id: 'dev_test', label: '🛠️ Dev / Test' },
  { id: 'hft', label: '⚡ HFT' },
  { id: 'custom', label: '✏️ Custom' },
]

const COMMITMENT_OPTIONS = [
  { id: 'on_demand', label: 'Pay as you go' },
  { id: '1_year', label: '1-year savings' },
  { id: '3_year', label: '3-year savings' },
]

const PRIORITY_OPTIONS = [
  { id: 'cost', label: '💰 Cost' },
  { id: 'speed', label: '⚡ Speed' },
  { id: 'reliability', label: '🛡️ Reliability' },
  { id: 'scalability', label: '📈 Scalability' },
  { id: 'balanced', label: '⚖️ Balanced' },
]

const REGION_OPTIONS = [
  { id: 'north_america', label: 'North America' },
  { id: 'europe', label: 'Europe' },
  { id: 'asia_pacific', label: 'Asia Pacific' },
  { id: 'south_america', label: 'South America' },
  { id: 'africa', label: 'Africa' },
  { id: 'multi_region', label: 'Multi-region' },
]

const pillSelected = {
  background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))',
  border: '1px solid rgba(124,58,237,0.5)',
  color: '#a78bfa',
  boxShadow: '0 0 15px rgba(124,58,237,0.2)',
}
const pillUnselected = {
  background: 'rgba(13,13,31,0.5)',
  border: '1px solid rgba(30,30,74,0.8)',
  color: '#64748b',
}

export default function QuickForm({ onSubmit, loading }) {
  const [workloadType, setWorkloadType] = useState('web_app')
  const [budgetMonthly, setBudgetMonthly] = useState(100)
  const [commitmentType, setCommitmentType] = useState('on_demand')
  const [performancePriority, setPerformancePriority] = useState('balanced')
  const [regions, setRegions] = useState([])

  const handleRegionToggle = (id) => {
    setRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    onSubmit({
      workload_type: workloadType,
      budget_monthly: budgetMonthly,
      commitment_type: commitmentType,
      performance_priority: performancePriority,
      regions: regions.length ? regions : ['north_america'],
    })
  }

  const pctBudget = (budgetMonthly / 1000) * 100

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>📋 Tell us about your needs</h3>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>What will you run?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {WORKLOAD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setWorkloadType(opt.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                transition: 'all 0.2s ease',
                ...(workloadType === opt.id ? pillSelected : pillUnselected),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Monthly Budget</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: 'white',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ${budgetMonthly}/mo
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={10}
          value={budgetMonthly}
          onChange={(e) => setBudgetMonthly(Number(e.target.value))}
          style={{
            width: '100%',
            background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${pctBudget}%, rgba(124,58,237,0.15) ${pctBudget}%)`,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>How long can you commit?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COMMITMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCommitmentType(opt.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid',
                cursor: 'pointer',
                fontSize: 13,
                ...(commitmentType === opt.id ? pillSelected : pillUnselected),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>What matters most?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPerformancePriority(opt.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid',
                cursor: 'pointer',
                fontSize: 13,
                ...(performancePriority === opt.id ? pillSelected : pillUnselected),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>Where do you need it?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {REGION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleRegionToggle(opt.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid',
                cursor: 'pointer',
                fontSize: 13,
                ...(regions.includes(opt.id) ? pillSelected : pillUnselected),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 14,
          background: loading
            ? 'linear-gradient(90deg, #1a1a3e 0%, #2a2a5e 50%, #1a1a3e 100%)'
            : 'linear-gradient(135deg, #7c3aed, #ec4899)',
          backgroundSize: loading ? '200% 100%' : undefined,
          animation: loading ? 'shimmer 2s infinite' : undefined,
          color: 'white',
          border: 'none',
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(124,58,237,0.4)',
        }}
      >
        {loading ? '⏳ Getting recommendations...' : '🚀 Get Recommendation'}
      </button>
    </div>
  )
}
