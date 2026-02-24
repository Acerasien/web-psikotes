// client/src/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import CreateUser from './CreateUser';

function Dashboard({ token, onLogout }) {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Fetch current user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        onLogout();
      }
    };
    fetchUser();
  }, [token]);

  // Function to fetch all participants
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(response.data);
    } catch (err) {
      console.error("Failed to fetch users list", err);
    }
  };

  // Load users list on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Psych Test Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button 
              onClick={onLogout}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. Create User Form */}
        <CreateUser token={token} onUserCreated={fetchUsers} />

        {/* 2. Users List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Participant List</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;