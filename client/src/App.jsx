// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './Login'
import AdminLayout from './AdminLayout'
import ParticipantDashboard from './ParticipantDashboard'
import TestRoutes from './routes/TestRoutes'
import './index.css'

function AppContent() {
  const { token, user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Memuat...</div>
        </div>
      </div>
    );
  }

  if (!token || !user) return <Login />

  // Routing Logic
  if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'assessor') {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<AdminLayout onLogout={logout} />} />
        </Routes>
      </Router>
    )
  } else {
    // Participant routing with test support
    return (
      <Router>
        <Routes>
          {/* Test routes - must be before dashboard to match first */}
          <Route path="/test/*" element={<TestRoutes />} />
          
          {/* Main participant dashboard */}
          <Route path="/*" element={<ParticipantDashboard onLogout={logout} />} />
          
          {/* Catch-all: redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    )
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
