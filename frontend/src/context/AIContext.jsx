// ── FILE: frontend/src/context/AIContext.jsx ──
import { createContext, useContext, useState, useEffect } from 'react'

export const AIContext = createContext()

const BASE_URL = 'http://127.0.0.1:8000'

export function AIProvider({ children }) {
  const [aiProvider, setAiProvider] = useState('openrouter')
  const [openrouterModel, setOpenrouterModel] = useState('mistralai/mistral-7b-instruct')
  const [ollamaModel, setOllamaModel] = useState('gpt-oss:120b-cloud')
  const [availableModels, setAvailableModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)

  useEffect(() => {
    setModelsLoading(true)
    fetch(`${BASE_URL}/admin/openrouter-models`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableModels(Array.isArray(data) ? data : [])
        setModelsLoading(false)
      })
      .catch(() => setModelsLoading(false))
  }, [])

  const currentModel = aiProvider === 'openrouter' ? openrouterModel : ollamaModel

  return (
    <AIContext.Provider
      value={{
        aiProvider,
        setAiProvider,
        openrouterModel,
        setOpenrouterModel,
        ollamaModel,
        setOllamaModel,
        availableModels,
        modelsLoading,
        currentModel,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export const useAI = () => useContext(AIContext)
