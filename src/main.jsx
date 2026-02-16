import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProposalProvider } from './context/ProposalContext'
import App from './App.jsx'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProposalProvider>
      <App />
    </ProposalProvider>
  </StrictMode>,
)
