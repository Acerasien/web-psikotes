// client/src/App.jsx
import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard' // Import the new component
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  // Pass token and logout function to Dashboard
  return <Dashboard token={token} onLogout={handleLogout} />
}

export default App