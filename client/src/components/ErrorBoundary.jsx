import { Component } from 'react';
import Swal from 'sweetalert2';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Show user-friendly error message
    Swal.fire({
      title: 'Ups! Terjadi kesalahan',
      text: 'Maaf, aplikasi mengalami kesalahan. Harap coba muat ulang halaman.',
      icon: 'error',
      confirmButtonText: 'Muat Ulang Halaman',
      confirmButtonColor: '#3085d6',
      showCancelButton: true,
      cancelButtonText: 'Kembali'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      } else if (result.dismiss === Swal.dismissTypes.cancel && window.history.length > 1) {
        window.history.back();
      }
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render a custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Terjadi kesalahan
            </h2>
            <p className="text-gray-600 mb-6">
              Mohon maaf atas ketidaknyamanan. Harap coba lagi.
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Coba Lagi
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detail Kesalahan (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64 text-red-600">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
