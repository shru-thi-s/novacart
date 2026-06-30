import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
          <div className="bg-surface p-8 md:p-12 rounded-3xl shadow-card max-w-lg w-full border border-gray-100 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            
            <p className="text-gray-600 mb-8">
              We're sorry, but an unexpected error occurred while rendering this page.
            </p>

            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-soft focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:outline-none"
            >
              <RefreshCw className="w-5 h-5" /> Reload Page
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-background rounded-xl text-left overflow-auto border border-gray-200">
                <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
