import { useState } from 'react'
import { refineAutomateRecommendation } from '../api'

const QUICK_QUESTIONS = [
  { label: 'Need more RAM?', adjustment: { min_ram: 8 } },
  { label: 'Europe only', adjustment: { regions: ['europe'] } },
  { label: 'Cheaper options', adjustment: { budget_monthly: 50 } },
  { label: 'More CPU', adjustment: { min_cpu: 4 } },
]

const cardStyle = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
}

export default function FollowUpChat({ recommendationId, onRefined }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [response, setResponse] = useState(null)

  const handleRefine = async (adjustment = null) => {
    if (!recommendationId) return
    setError(null)
    setResponse(null)
    setLoading(true)
    try {
      const data = await refineAutomateRecommendation({
        recommendation_id: recommendationId,
        question: question.trim() || undefined,
        adjustment: adjustment,
      })
      setResponse(data)
      if (data.new_recommendation?.length) {
        onRefined?.(data)
      }
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (adj) => {
    setQuestion('')
    handleRefine(adj)
  }

  if (!recommendationId) return null

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Got questions? Refine your results</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => handleQuickQuestion(q.adjustment)}
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid rgba(124,58,237,0.3)',
              background: 'rgba(124,58,237,0.08)',
              color: '#a78bfa',
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What if I need 8GB RAM? Show Europe only."
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(13,13,31,0.8)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 12,
            padding: 12,
            color: '#f1f5f9',
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={() => handleRefine()}
          disabled={loading || !question.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: loading ? 'rgba(124,58,237,0.2)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '...' : 'Ask'}
        </button>
      </div>
      {error && (
        <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>{error}</div>
      )}
      {response?.explanation && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'rgba(124,58,237,0.08)',
            borderRadius: 12,
            fontSize: 14,
            color: '#e2e8f0',
          }}
        >
          {response.explanation}
          {response.adjustment_cost_impact && (
            <div style={{ marginTop: 8, color: '#10b981', fontWeight: 600 }}>
              {response.adjustment_cost_impact}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
