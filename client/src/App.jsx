// client/src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import AdminLayout from './AdminLayout' // New Component
import ParticipantDashboard from './ParticipantDashboard'
import './index.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await fetch('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setUser(data);
      } catch (err) {
        handleLogout();
      }
    };
    fetchUser();
  }, [token]);

  if (!token) return <Login onLogin={handleLogin} />
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;

  // Routing Logic
  if (user.role === 'admin' || user.role === 'superadmin') {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<AdminLayout token={token} user={user} onLogout={handleLogout} />} />
        </Routes>
      </Router>
    )
  } else {
    return <ParticipantDashboard token={token} user={user} onLogout={handleLogout} />
  }
}

export default App