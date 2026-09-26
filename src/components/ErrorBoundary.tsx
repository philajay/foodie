import { Component, type ErrorInfo, type ReactNode } from 'react'
import { hasFirebaseConfig } from '../config/firebase-config'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const configMissing = !hasFirebaseConfig
    return (
      <div className="fatal">
        <h1>{configMissing ? 'Firebase setup required' : 'Something went wrong'}</h1>
        <p>{error.message}</p>
        {configMissing ? (
          <ol className="fatal__steps">
            <li>
              Copy <code>.env.example</code> to <code>.env.local</code>
            </li>
            <li>Paste your Firebase web app config into <code>.env.local</code></li>
            <li>
              Run <code>npm run seed</code> to upload restaurants and images
            </li>
            <li>Restart <code>npm run dev</code></li>
          </ol>
        ) : null}
        <button type="button" className="fatal__retry" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
