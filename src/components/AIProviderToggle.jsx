// ── FILE: frontend/src/components/AIProviderToggle.jsx ──
import { useState, useRef, useEffect } from 'react'
import { useAI } from '../context/AIContext'

const OLLAMA_MODELS = ['gpt-oss:120b-cloud', 'llama3.2', 'mistral', 'phi3']

const FALLBACK_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)', context: 128000 },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)', context: 128000 },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context: 200000 },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5 (Google)', context: 1000000 },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct', context: 32768 },
]

function formatContext(ctx) {
  if (!ctx) return ''
  if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(0)}M`
  if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}k`
  return String(ctx)
}

export default function AIProviderToggle() {
  const {
    aiProvider,
    setAiProvider,
    openrouterModel,
    setOpenrouterModel,
    ollamaModel,
    setOllamaModel,
    availableModels,
    modelsLoading,
  } = useAI()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  const models = (availableModels?.length ? availableModels : FALLBACK_MODELS).map((m) => ({
    id: m.id,
    name: m.name || m.id,
    context: m.context ?? m.context_length ?? 0,
  }))
  const filtered = search.trim()
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase())
      )
    : models
  const selectedModel = models.find((m) => m.id === openrouterModel) || { id: openrouterModel, name: openrouterModel, context: 0 }

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProvider = (p) => {
    setAiProvider(p)
    if (p === 'ollama') setOllamaModel(ollamaModel)
    else setOpenrouterModel(openrouterModel)
  }
  const handleOllamaModel = (m) => setOllamaModel(m)
  const handleSelectModel = (m) => {
    setOpenrouterModel(m.id)
    setDropdownOpen(false)
    setSearch('')
  }
  const handleCustomModel = () => {
    const id = search.trim()
    if (id) {
      setOpenrouterModel(id)
      setDropdownOpen(false)
      setSearch('')
    }
  }

  const pillContainer = {
    background: 'rgba(13,13,31,0.8)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 50,
    padding: 4,
    display: 'inline-flex',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  }
  const pillOpenRouter = {
    borderRadius: 50,
    padding: '8px 20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: aiProvider === 'openrouter' ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))' : 'transparent',
    border: `1px solid ${aiProvider === 'openrouter' ? 'rgba(124,58,237,0.5)' : 'transparent'}`,
    color: aiProvider === 'openrouter' ? '#a78bfa' : '#64748b',
    boxShadow: aiProvider === 'openrouter' ? '0 0 15px rgba(124,58,237,0.2)' : 'none',
    fontWeight: 600,
    fontSize: 13,
  }
  const pillOllama = {
    borderRadius: 50,
    padding: '8px 20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: aiProvider === 'ollama' ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(16,185,129,0.2))' : 'transparent',
    border: `1px solid ${aiProvider === 'ollama' ? 'rgba(6,182,212,0.4)' : 'transparent'}`,
    color: aiProvider === 'ollama' ? '#06b6d4' : '#64748b',
    fontWeight: 600,
    fontSize: 13,
  }

  const modelButtonLabel =
    aiProvider === 'openrouter'
      ? modelsLoading
        ? 'Loading…'
        : (selectedModel?.name || openrouterModel || 'Select model')
      : ollamaModel

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative' }} ref={dropdownRef}>
      {/* Provider pills + Model button in one row so they fit in the navbar */}
      <div style={pillContainer}>
        <button type="button" onClick={() => handleProvider('openrouter')} style={pillOpenRouter}>
          🌐 OpenRouter
        </button>
        <button type="button" onClick={() => handleProvider('ollama')} style={pillOllama}>
          🦙 Ollama
        </button>
      </div>

      {/* Model selector: single button that opens dropdown (keeps navbar one row) */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          background: aiProvider === 'openrouter' ? 'rgba(13,13,31,0.9)' : 'rgba(13,13,31,0.9)',
          border: aiProvider === 'openrouter' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(6,182,212,0.4)',
          borderRadius: 10,
          padding: '8px 14px',
          color: aiProvider === 'openrouter' ? '#a78bfa' : '#06b6d4',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 140,
          maxWidth: 220,
        }}
        title="Click to change model"
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelButtonLabel}</span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>▼</span>
      </button>

      {/* Dropdown: opens below the row so it’s visible (above page content) */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            background: 'rgba(15,15,35,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 1001,
            minWidth: 280,
            maxWidth: 320,
            maxHeight: 340,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {aiProvider === 'openrouter' ? (
            <>
              <input
                type="text"
                placeholder="Search or type model ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  margin: 8,
                  padding: '8px 12px',
                  background: 'rgba(13,13,31,0.8)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
              />
              {search.trim() && !filtered.some((m) => m.id === search.trim()) && (
                <button
                  type="button"
                  onClick={handleCustomModel}
                  style={{
                    margin: '0 8px 8px',
                    padding: '8px 12px',
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 8,
                    color: '#a78bfa',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Use custom model: {search.trim()}
                </button>
              )}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px 8px', maxHeight: 260 }}>
                {filtered.map((m) => (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectModel(m)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: openrouterModel === m.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                      color: openrouterModel === m.id ? '#a78bfa' : '#e2e8f0',
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (openrouterModel !== m.id) e.currentTarget.style.background = 'rgba(124,58,237,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      if (openrouterModel !== m.id) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.id}</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: 4 }}>{formatContext(m.context)} ctx</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', padding: '8px 10px', borderTop: '1px solid rgba(124,58,237,0.1)' }}>
                💳 Pay per use — openrouter.ai/models
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '12px 10px 8px', fontSize: 12, color: '#94a3b8' }}>Select local model</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 10px 12px' }}>
                {OLLAMA_MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      handleOllamaModel(m)
                      setDropdownOpen(false)
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: `1px solid ${ollamaModel === m ? '#06b6d4' : 'rgba(30,30,74,0.8)'}`,
                      background: ollamaModel === m ? 'rgba(6,182,212,0.2)' : 'transparent',
                      color: ollamaModel === m ? '#06b6d4' : '#64748b',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#10b981', padding: '8px 10px', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                🔒 100% Local — Free & Private · localhost:11434
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
