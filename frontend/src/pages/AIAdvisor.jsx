// ── FILE: frontend/src/pages/AIAdvisor.jsx ──
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendChatMessage, fetchInstances } from '../api'
import { useAI } from '../context/AIContext'
import ChatWindow from '../components/ChatWindow'

function shortModelName(modelId) {
  if (!modelId) return 'OpenRouter'
  const last = modelId.split('/').pop() || modelId
  return last
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const SUGGESTIONS = [
  '🌐 Best server for a web app',
  '💰 How to reduce cloud costs',
  '⚡ Fastest instance under $100/mo',
]

const glassCard = {
  background: 'rgba(15,15,35,0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 0 1px rgba(124,58,237,0.05), 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function AIAdvisor() {
  const navigate = useNavigate()
  const { aiProvider, currentModel, openrouterModel, ollamaModel } = useAI()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestedFilters, setSuggestedFilters] = useState(null)
  const [instancesContext, setInstancesContext] = useState('')
  const [welcomeInput, setWelcomeInput] = useState('')

  useEffect(() => {
    fetchInstances({}).then((list) => {
      setInstancesContext(JSON.stringify({ count: list?.length ?? 0, sample: (list || []).slice(0, 5).map((i) => ({ name: i.name, provider: i.provider?.name, cpu: i.cpu, ram: i.ram, monthly: i.monthly_price })) }))
    }).catch(() => {})
  }, [])

  const handleSend = (text) => {
    const userMsg = { role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setLoading(true)
    setSuggestedFilters(null)
    sendChatMessage(
      [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      instancesContext,
      aiProvider,
      currentModel
    )
      .then((res) => {
        setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
        if (res.suggested_filters && Object.keys(res.suggested_filters).length) setSuggestedFilters(res.suggested_filters)
      })
      .catch(() => setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not get a response. Check your API key and connection.' }]))
      .finally(() => setLoading(false))
  }

  const handleApplyFilters = (filters) => {
    const params = new URLSearchParams()
    if (filters.min_cpu != null) params.set('min_cpu', filters.min_cpu)
    if (filters.min_ram != null) params.set('min_ram', filters.min_ram)
    navigate(`/compare?${params.toString()}`)
    setSuggestedFilters(null)
  }

  const showWelcome = messages.length === 0
  const modelDisplayName = aiProvider === 'openrouter' ? shortModelName(openrouterModel) : ollamaModel
  const providerLabel = aiProvider === 'openrouter' ? 'OpenRouter' : 'Local'
  const providerBadge =
    aiProvider === 'openrouter'
      ? { text: `🌐 ${modelDisplayName}`, style: { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 } }
      : { text: `🦙 ${ollamaModel} — Local`, style: { background: 'linear-gradient(135deg, #06b6d4, #10b981)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 } }

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: 'rgba(2,2,8,0.5)' }}>
      {/* Header */}
      <div
        style={{
          background: 'rgba(15,15,35,0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🤖 AI Cost Advisor</h1>
          <span style={providerBadge.style}>{providerBadge.text}</span>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          style={{
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
            padding: '8px 16px',
            borderRadius: 12,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Clear Chat
        </button>
      </div>

      {aiProvider === 'ollama' && (
        <div
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#f59e0b',
            borderRadius: 8,
            padding: '8px 16px',
            margin: '0 24px',
            fontSize: 13,
          }}
        >
          ⚡ Local AI — responses may take 30-120 seconds
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {showWelcome ? (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
              <div style={{ ...glassCard, maxWidth: 520, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Hi! I'm your AI Cloud Advisor</h2>
                <p style={{ margin: '0 0 8px', color: '#64748b', lineHeight: 1.6 }}>
                  Powered by {modelDisplayName} via {providerLabel}
                </p>
                {aiProvider === 'openrouter' && (
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>
                    You're using {modelDisplayName}. Switch models in the navbar anytime.
                  </p>
                )}
                {aiProvider === 'ollama' && <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>Ask me anything about cloud pricing or instance selection.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      style={{
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        color: '#a78bfa',
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid rgba(124,58,237,0.1)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <textarea
                placeholder="Type your question..."
                value={welcomeInput}
                onChange={(e) => setWelcomeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const t = welcomeInput.trim()
                    if (t) { handleSend(t); setWelcomeInput('') }
                  }
                }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  maxHeight: 120,
                  background: 'rgba(13,13,31,0.8)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  color: '#f1f5f9',
                  fontSize: 14,
                  resize: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => { const t = welcomeInput.trim(); if (t) { handleSend(t); setWelcomeInput(''); } }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  border: 'none',
                  color: 'white',
                  fontSize: 18,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                }}
              >
                →
              </button>
            </div>
          </>
        ) : (
          <ChatWindow
            messages={messages}
            loading={loading}
            onSend={handleSend}
            suggestedFilters={suggestedFilters}
            onApplyFilters={handleApplyFilters}
            aiLabel={aiProvider === 'openrouter' ? `🌐 ${modelDisplayName}` : `🦙 ${ollamaModel}`}
          />
        )}
      </div>
    </div>
  )
}
