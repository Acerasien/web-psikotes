/**
 * PageWrapper Component
 * Wraps pages with consistent loading and error handling
 */
import LoadingSpinner from './LoadingSpinner';

function PageWrapper({ 
  loading, 
  error, 
  onRetry, 
  children,
  loadingText = 'Memuat...',
  errorTitle = 'Gagal memuat',
  errorMessage = 'Harap coba lagi'
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" text={loadingText} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {errorTitle}
          </h2>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default PageWrapper;
