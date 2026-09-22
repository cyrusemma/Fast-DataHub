import { Component } from 'react'
import Button from './ui/Button'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
          <h1 className="font-display text-xl font-extrabold text-text">Something went wrong</h1>
          <p className="mt-2 text-sm text-text-muted">{this.state.error.message}</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload app</Button>
        </div>
      </div>
    )
  }
}
