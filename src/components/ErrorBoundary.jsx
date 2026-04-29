import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[EventHub] Unhandled error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#000', minHeight: '100vh', color: '#fff',
          fontFamily: "'Courier New', monospace", display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px', textAlign: 'center',
        }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.3rem', letterSpacing: '0.1em', marginBottom: '8px' }}>
            EVENT<span style={{ color: '#4361ee' }}>●</span>HUB
          </p>
          <p style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.06em' }}>
            SOMETHING WENT WRONG
          </p>
          <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '28px', maxWidth: '400px', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            style={{ background: '#4361ee', color: '#fff', border: 'none', padding: '13px 32px', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.1em' }}
          >
            BACK TO HOME →
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
