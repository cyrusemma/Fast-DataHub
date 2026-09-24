import { Component } from 'react'
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import Button from './ui/Button'

export default class ErrorBoundary extends Component {
  state = { error: null, errorInfo: null, showDetails: false, copied: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Fast-DataHub ErrorBoundary caught an exception:', error, errorInfo)
  }

  handleCopyDiagnostics = async () => {
    const details = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack:\n${this.state.error?.stack || 'No stack trace'}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'No component stack'}`
    try {
      await navigator.clipboard.writeText(details)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2500)
    } catch {
      // ignore
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-8 ring-danger/5">
            <AlertTriangle size={32} />
          </div>

          <div className="text-center">
            <h1 className="font-display text-xl sm:text-2xl font-black text-text">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              An unexpected application error occurred. You can reload the app or return to the main dashboard.
            </p>
          </div>

          {/* Error message card */}
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-left">
            <p className="font-mono text-xs font-bold text-danger break-words">
              {this.state.error?.message || 'Unknown runtime error'}
            </p>
          </div>

          {/* Collapsible stack details */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-xs font-semibold text-text-muted transition hover:text-text"
            >
              <span>{this.state.showDetails ? 'Hide technical details' : 'View technical details'}</span>
              {this.state.showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {this.state.showDetails && (
              <div className="mt-2 rounded-xl border border-border bg-bg p-3.5 text-left animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-text-muted">Stack Trace:</span>
                  <button
                    type="button"
                    onClick={this.handleCopyDiagnostics}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    {this.state.copied ? (
                      <>
                        <Check size={12} className="text-success" />
                        <span className="text-success">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy diagnostics</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-48 overflow-auto font-mono text-[11px] text-text-subtle whitespace-pre-wrap leading-tight select-all">
                  {this.state.error?.stack || this.state.errorInfo?.componentStack || 'No detailed stack available'}
                </pre>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Button
              className="w-full sm:w-1/2"
              icon={RotateCcw}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-1/2"
              icon={Home}
              onClick={() => (window.location.href = '/')}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
