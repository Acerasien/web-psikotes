// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './Login'
import AdminLayout from './AdminLayout'
import ParticipantDashboard from './ParticipantDashboard'
import './index.css'

function AppContent() {
  const { token, user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!token || !user) return <Login />

  // Routing Logic
  if (user.role === 'admin' || user.role === 'superadmin') {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<AdminLayout onLogout={logout} />} />
        </Routes>
      </Router>
    )
  } else {
    return <ParticipantDashboard onLogout={logout} />
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