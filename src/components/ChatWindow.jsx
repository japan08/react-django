// ── FILE: frontend/src/components/ChatWindow.jsx ──
import { useState, useRef, useEffect } from 'react'

const bubbleUser = {
  alignSelf: 'flex-end',
  maxWidth: '70%',
  background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.3))',
  border: '1px solid rgba(124,58,237,0.3)',
  color: '#f1f5f9',
  padding: '12px 16px',
  borderRadius: '20px 20px 4px 20px',
  backdropFilter: 'blur(10px)',
  animation: 'messageIn 0.4s ease forwards',
}
const bubbleAssistant = {
  alignSelf: 'flex-start',
  maxWidth: '75%',
  background: 'rgba(15,15,35,0.8)',
  border: '1px solid rgba(30,30,74,0.8)',
  color: '#e2e8f0',
  padding: '16px',
  borderRadius: '4px 20px 20px 20px',
  backdropFilter: 'blur(10px)',
  animation: 'messageIn 0.4s ease forwards',
}

export default function ChatWindow({ messages = [], loading = false, onSend, suggestedFilters, onApplyFilters, aiLabel = '⚡ Claude' }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = () => {
    const t = input.trim()
    if (!t || loading) return
    onSend(t)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
      <style>{`
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? bubbleUser : bubbleAssistant}>
            {m.role === 'assistant' && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{aiLabel}</div>}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ ...bubbleAssistant }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{aiLabel}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'typingDot 1.4s ease-in-out infinite' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'typingDot 1.4s ease-in-out infinite', animationDelay: '0.15s' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'typingDot 1.4s ease-in-out infinite', animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {suggestedFilters && Object.keys(suggestedFilters).length > 0 && (
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 12,
            margin: '0 24px 12px',
            cursor: 'pointer',
            color: '#e2e8f0',
          }}
          onClick={() => onApplyFilters?.(suggestedFilters)}
          role="button"
          tabIndex={0}
        >
          🔍 Apply suggested filters to Compare →
        </div>
      )}
      <div style={{ padding: 16, borderTop: '1px solid rgba(124,58,237,0.1)', display: 'flex', gap: 12, alignItems: 'flex-end', background: 'rgba(2,2,8,0.5)' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your workload or ask for recommendations..."
          rows={1}
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
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: loading || !input.trim() ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none',
            color: 'white',
            fontSize: 18,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            transition: 'all 0.3s ease',
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
