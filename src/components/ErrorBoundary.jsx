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
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-card">
          <h1 className="font-display text-xl font-extrabold text-dark">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">{this.state.error.message}</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload app</Button>
        </div>
      </div>
    )
  }
}
