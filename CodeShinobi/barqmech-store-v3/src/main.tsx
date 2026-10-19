import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/storefront.css'
import App from './App.tsx'

if (import.meta.env.DEV && new URLSearchParams(location.search).has('motionDebug')) {
  void import('./dev/motionDiagnostics.ts').then(module=>module.startMotionDiagnostics())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
