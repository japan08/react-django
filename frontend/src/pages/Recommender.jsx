// ── FILE: frontend/src/pages/Recommender.jsx ──
import { useState, useRef } from 'react'
import { getRecommendations } from '../api'
import { useAI } from '../context/AIContext'
import WorkloadForm from '../components/WorkloadForm'
import RecommendationCards from '../components/RecommendationCards'

function shortModelName(modelId) {
  if (!modelId) return 'OpenRouter'
  const last = modelId.split('/').pop() || modelId
  return last
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function mergeFormData(prev, next) {
  return { ...prev, ...next, provider_ids: prev.provider_ids || [] }
}

const MAX_CHARS = 500
const EXAMPLE_CHIPS = [
  { label: '🌐 Web App', text: 'I need a reliable server for a high-traffic web application with 50k daily users, needs fast response times and reliability.' },
  { label: '🤖 ML Training', text: 'I need to run Python ML training jobs with large datasets. GPU not required but need lots of RAM and fast CPU.' },
  { label: '🗄️ Database', text: 'I need a dedicated database server for PostgreSQL. High IOPS, lots of RAM for caching, moderate CPU.' },
  { label: '🎮 Game Server', text: 'I need a game server for 100 concurrent players. Low latency is critical, need good CPU and at least 8GB RAM.' },
]

const glassCard = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function Recommender() {
  const { aiProvider, currentModel, openrouterModel, ollamaModel } = useAI()
  const resultsRef = useRef(null)
  const [formData, setFormData] = useState({
    workload_type: 'web app',
    max_monthly_budget: 0,
    min_cpu: 0,
    min_ram: 0,
    provider_ids: [],
  })
  const setFormDataMerged = (next) => setFormData((prev) => mergeFormData(prev, next))
  const [naturalText, setNaturalText] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [jsonParseError, setJsonParseError] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(0)

  const modelDisplayName = aiProvider === 'openrouter' ? shortModelName(openrouterModel) : ollamaModel
  const loadingMessage =
    aiProvider === 'openrouter'
      ? `🌐 ${modelDisplayName} is analyzing your requirements...`
      : `🦙 ${ollamaModel} is analyzing locally... (may take 30-60s)`

  const handleSubmit = async () => {
    setError(null)
    setJsonParseError(false)
    setLoading(true)
    setResults(null)
    const interval = setInterval(() => setLoadingPhase((p) => (p + 1) % 3), 2000)
    try {
      const payload = {
        workload_type: formData.workload_type,
        max_monthly_budget: formData.max_monthly_budget,
        min_cpu: formData.min_cpu,
        min_ram: formData.min_ram,
        natural_language: naturalText.trim() || undefined,
        provider_ids: formData.provider_ids || [],
      }
      const data = await getRecommendations(payload, aiProvider, currentModel)
      setResults(data)
      if (data.summary && data.summary.includes('unexpected format')) {
        setJsonParseError(true)
      }
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Request failed')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setFormData({ workload_type: 'web app', max_monthly_budget: 0, min_cpu: 0, min_ram: 0, provider_ids: [] })
    setNaturalText('')
    setResults(null)
    setError(null)
    setJsonParseError(false)
  }

  const providerChip =
    aiProvider === 'openrouter'
      ? { text: `🌐 ${modelDisplayName} via OpenRouter`, style: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '6px 16px', borderRadius: 20, fontSize: 12 } }
      : { text: `🦙 ${ollamaModel} — Local AI`, style: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '6px 16px', borderRadius: 20, fontSize: 12 } }

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(124,58,237,0.3)',
            background: 'rgba(124,58,237,0.08)',
            borderRadius: 20,
            padding: '6px 16px',
            fontSize: 12,
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s ease-in-out infinite' }} />
          🤖 AI-POWERED
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', lineHeight: 1.2 }}>
          Find Your Perfect
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Cloud Server
          </span>
        </h1>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 18 }}>
          Describe your workload in plain English or use the smart form below.
        </p>
        <span style={providerChip.style}>{providerChip.text}</span>
      </section>

      {/* Input section */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
        <WorkloadForm onChange={setFormDataMerged} />
        <div style={glassCard}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>💬 Describe Your Workload</h3>
          <textarea
            value={naturalText}
            onChange={(e) => setNaturalText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="e.g. I need a reliable server for a Node.js API with Redis caching and a PostgreSQL database. We expect around 10,000 daily active users with traffic spikes during business hours. Our budget is around $80-100 per month..."
            maxLength={MAX_CHARS}
            style={{
              width: '100%',
              minHeight: 160,
              boxSizing: 'border-box',
              background: 'rgba(13,13,31,0.8)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 12,
              padding: 14,
              color: '#f1f5f9',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b', marginTop: 6 }}>{naturalText.length} / {MAX_CHARS}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setNaturalText((t) => (t ? t + ' ' : '') + chip.text)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.2)',
                  background: 'rgba(13,13,31,0.5)',
                  color: '#a78bfa',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginBottom: 32 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            height: 60,
            borderRadius: 16,
            background: loading ? 'linear-gradient(90deg, #1a1a3e 0%, #2a2a5e 50%, #1a1a3e 100%)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            backgroundSize: loading ? '200% 100%' : undefined,
            animation: loading ? 'shimmer 2s infinite' : undefined,
            color: 'white',
            border: 'none',
            fontSize: 18,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
          }}
        >
          {loading ? loadingMessage : '🔍 Analyze & Find My Perfect Server'}
        </button>
        {loading && (
          <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, #7c3aed, #ec4899)', borderRadius: 2, animation: 'shimmer 1.5s infinite' }} />
          </div>
        )}
      </section>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, marginBottom: 24, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {jsonParseError && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, color: '#f59e0b' }}>
          <div style={{ marginBottom: 12 }}>⚠️ Model returned unexpected format.</div>
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>Try a different model — GPT-4o and Claude 3.5 are most reliable for structured output.</p>
          <button
            type="button"
            onClick={() => document.querySelector('[data-ai-toggle]')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #7c3aed', background: 'rgba(124,58,237,0.2)', color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}
          >
            Open Model Selector
          </button>
        </div>
      )}

      <section ref={resultsRef} style={{ marginTop: 40 }}>
        {results && (
          <>
            <div
              style={{
                background: 'rgba(124,58,237,0.08)',
                borderLeft: '4px solid transparent',
                borderImage: 'linear-gradient(135deg, #7c3aed, #ec4899) 1',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                color: '#e2e8f0',
              }}
            >
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>✅ I understood:</div>
              <div>{results.requirements_understood}</div>
            </div>
            <RecommendationCards recommendations={results.recommendations} />
            <div style={{ ...glassCard, marginTop: 24 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>💡 Analysis Summary {aiProvider === 'openrouter' ? `by ${modelDisplayName}` : `by ${ollamaModel}`}</h3>
              <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.8 }}>{results.summary}</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                type="button"
                onClick={handleStartOver}
                style={{
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#a78bfa',
                  borderRadius: 12,
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                🔄 Start Over
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
