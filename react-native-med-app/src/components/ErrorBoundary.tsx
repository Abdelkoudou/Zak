// ============================================================================
// Error Boundary - Catches JS errors and prevents app crashes
// Crash-Safe Implementation
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react'

// Lazy-loaded React Native components
let _View: any = null
let _Text: any = null
let _TouchableOpacity: any = null
let _StyleSheet: any = null
let _rnLoaded = false
let _styles: any = null

function loadRN() {
  if (_rnLoaded) return
  _rnLoaded = true
  
  try {
    const RN = require('react-native')
    _View = RN.View
    _Text = RN.Text
    _TouchableOpacity = RN.TouchableOpacity
    _StyleSheet = RN.StyleSheet
    
    _styles = _StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      content: {
        alignItems: 'center',
        maxWidth: 300,
      },
      emoji: {
        fontSize: 64,
        marginBottom: 16,
      },
      title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
      },
      message: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
      },
      errorText: {
        fontSize: 12,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'monospace',
      },
      button: {
        backgroundColor: '#09b2ac',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
      },
      buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
      },
    })
  } catch (error) {
    if (__DEV__) {
      console.warn('[ErrorBoundary] Failed to load react-native:', error)
    }
  }
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error)
      console.error('[ErrorBoundary] Error info:', errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Load RN components when needed
      loadRN()
      
      // If RN failed to load, return null (app will show blank screen but won't crash)
      if (!_View || !_Text || !_TouchableOpacity || !_styles) {
        return null
      }

      const View = _View
      const Text = _Text
      const TouchableOpacity = _TouchableOpacity
      const styles = _styles

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Une erreur est survenue</Text>
            <Text style={styles.message}>
              L'application a rencontré un problème. Veuillez réessayer.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorText}>
                {this.state.error.message}
              </Text>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
