// client/src/App.jsx
import { useState, useEffect } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import ParticipantDashboard from './ParticipantDashboard'
import './index.css' // Ensure tailwind is loaded

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

  // Fetch user data once we have a token
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
        console.error("Token invalid or expired");
        handleLogout();
      }
    };
    fetchUser();
  }, [token]);

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  // Loading state
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  // ROLE-BASED ROUTING
  if (user.role === 'admin') {
    return <Dashboard token={token} onLogout={handleLogout} />
  } else {
    return <ParticipantDashboard token={token} user={user} onLogout={handleLogout} />
  }
}

export default App