import { useState } from 'react'
import { submitAutomateRequirements } from '../api'
import QuickForm from '../components/QuickForm'
import RecommendationTiers from '../components/RecommendationTiers'
import FollowUpChat from '../components/FollowUpChat'

const glassCard = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function Automate() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (payload) => {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const data = await submitAutomateRequirements(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setResult(null)
    setError(null)
  }

  const handleRefined = (refineData) => {
    if (refineData?.new_recommendation?.length) {
      setResult((prev) => ({
        ...prev,
        tiers: refineData.new_recommendation,
      }))
    }
  }

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
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
          QUICK RECOMMEND
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', lineHeight: 1.2 }}>
          Find Your Perfect Server
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            in 30 Seconds
          </span>
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 16 }}>
          Simple form. Instant recommendations. No AI chat required.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        <QuickForm onSubmit={handleSubmit} loading={loading} />
        <div>
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                color: '#ef4444',
              }}
            >
              {error}
            </div>
          )}
          {result && (
            <>
              <div style={{ ...glassCard, marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>✅ Workload specs</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span style={{ background: 'rgba(124,58,237,0.1)', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}>
                    {result.workload_mapped_specs?.min_cpu}+ vCPU
                  </span>
                  <span style={{ background: 'rgba(124,58,237,0.1)', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}>
                    {result.workload_mapped_specs?.recommended_ram}+ GB RAM
                  </span>
                  <span style={{ background: 'rgba(124,58,237,0.1)', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}>
                    {result.workload_mapped_specs?.storage_min}+ GB storage
                  </span>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>{result.reasoning}</div>
              </div>
              <RecommendationTiers
                tiers={result.tiers}
                costProjection={result.cost_projection}
                onCompare={(ids) => window.location.assign(`/compare?ids=${ids?.join(',')}`)}
              />
              <div style={{ marginTop: 32 }}>
                <FollowUpChat
                  recommendationId={result.recommendation_id}
                  onRefined={handleRefined}
                />
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
          {!result && !error && !loading && (
            <div
              style={{
                ...glassCard,
                textAlign: 'center',
                color: '#64748b',
                padding: 48,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>Fill the form and click Get Recommendation</div>
              <div style={{ fontSize: 13 }}>You'll get 4 tiers: Top Pick, Budget, Performance, Growth Path</div>
            </div>
          )}
        </div>
      </section>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
