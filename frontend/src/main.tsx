import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { SavedSchemesProvider } from './context/SavedSchemesContext.tsx'
import { AiAssistantProvider } from './context/AiAssistantContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SavedSchemesProvider>
          <AiAssistantProvider>
            <App />
          </AiAssistantProvider>
        </SavedSchemesProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
