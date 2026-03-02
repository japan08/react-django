// ── FILE: frontend/src/components/WorkloadForm.jsx ──
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
  { id: 'web app', label: '🌐 Web App' },
  { id: 'ML/AI', label: '🤖 ML/AI' },
  { id: 'database', label: '🗄️ Database' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'email', label: '📧 Email' },
  { id: 'CI/CD', label: '🔄 CI/CD' },
  { id: 'analytics', label: '📊 Analytics' },
  { id: 'dev/test', label: '🛠️ Dev/Test' },
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

export default function WorkloadForm({ onChange }) {
  const [workloadType, setWorkloadType] = useState('web app')
  const [maxMonthlyBudget, setMaxMonthlyBudget] = useState(0)
  const [minCpu, setMinCpu] = useState(0)
  const [minRam, setMinRam] = useState(0)

  const emit = (updates) => {
    const next = { workload_type: workloadType, max_monthly_budget: maxMonthlyBudget, min_cpu: minCpu, min_ram: minRam, ...updates }
    onChange?.(next)
  }

  const handleWorkload = (id) => {
    setWorkloadType(id)
    emit({ workload_type: id })
  }
  const handleBudget = (v) => {
    const val = Number(v)
    setMaxMonthlyBudget(val)
    emit({ max_monthly_budget: val })
  }
  const handleCpu = (v) => {
    const val = Number(v)
    setMinCpu(val)
    emit({ min_cpu: val })
  }
  const handleRam = (v) => {
    const val = Number(v)
    setMinRam(val)
    emit({ min_ram: val })
  }

  const pctBudget = (maxMonthlyBudget / 500) * 100
  const pctCpu = (minCpu / 32) * 100
  const pctRam = (minRam / 128) * 100

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>📋 Configure Requirements</h3>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>Workload Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {WORKLOAD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleWorkload(opt.id)}
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
            {maxMonthlyBudget === 0 ? 'No Limit ∞' : `$${maxMonthlyBudget}/mo`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={maxMonthlyBudget}
          onChange={(e) => handleBudget(e.target.value)}
          style={{
            width: '100%',
            background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${pctBudget}%, rgba(124,58,237,0.15) ${pctBudget}%)`,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Minimum CPU</span>
          <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{minCpu === 0 ? 'Any' : `${minCpu} cores`}</span>
        </div>
        <input
          type="range"
          min={0}
          max={32}
          step={1}
          value={minCpu}
          onChange={(e) => handleCpu(e.target.value)}
          style={{
            width: '100%',
            background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${pctCpu}%, rgba(124,58,237,0.15) ${pctCpu}%)`,
          }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Minimum RAM</span>
          <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{minRam === 0 ? 'Any' : `${minRam} GB`}</span>
        </div>
        <input
          type="range"
          min={0}
          max={128}
          step={2}
          value={minRam}
          onChange={(e) => handleRam(e.target.value)}
          style={{
            width: '100%',
            background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${pctRam}%, rgba(124,58,237,0.15) ${pctRam}%)`,
          }}
        />
      </div>
    </div>
  )
}
