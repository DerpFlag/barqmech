import { Component, type ErrorInfo, type ReactNode, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

class RootErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null }

  static getDerivedStateFromError(err: unknown): { err: Error } {
    return {
      err: err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error'),
    }
  }

  componentDidCatch(err: unknown, info: ErrorInfo) {
    console.error(err, info.componentStack)
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
          <h1 style={{ fontSize: '1.25rem' }}>This page hit an error</h1>
          <p style={{ opacity: 0.85 }}>{this.state.err.message}</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Open the browser console for the full stack. If this appeared after changing environment
            variables, check that Supabase URL and anon key have no extra quotes or line breaks.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

let rootInstance: Root | null = null

export function mountApp(target: HTMLElement) {
  if (rootInstance) {
    rootInstance.render(
      <StrictMode>
        <RootErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RootErrorBoundary>
      </StrictMode>,
    )
    return
  }
  rootInstance = createRoot(target)
  rootInstance.render(
    <StrictMode>
      <RootErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RootErrorBoundary>
    </StrictMode>,
  )
}
