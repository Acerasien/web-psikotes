// client/src/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import CreateUser from './CreateUser';

function Dashboard({ token, onLogout }) {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [tests, setTests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTest, setSelectedTest] = useState({});

  // 1. Fetch current user profile
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

  // 2. Fetch Users
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

  // 3. Fetch Tests
  const fetchTests = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/tests/', {
         headers: { Authorization: `Bearer ${token}` } 
      });
      setTests(res.data);
    } catch (err) {
      console.error("Failed to fetch tests", err);
    }
  };

  // 4. Fetch Assignments
  const fetchAssignments = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/assignments/', {
         headers: { Authorization: `Bearer ${token}` } 
      });
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchUsers();
    fetchTests();
    fetchAssignments();
  }, []);

  // 5. Handle Assign Button Click
  const handleAssign = async (userId) => {
    const testId = selectedTest[userId];
    if (!testId) {
      alert("Please select a test first");
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/assignments/?user_id=${userId}&test_id=${testId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Test assigned!");
      fetchAssignments(); // Refresh list to show "Assigned"
    } catch (err) {
      alert("Error assigning test: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

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
        
        <CreateUser token={token} onUserCreated={fetchUsers} />

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Participant List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  {/* NEW ACTION COLUMN */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Test</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.full_name || u.username}</div>
                      <div className="text-sm text-gray-500">{u.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    {/* ACTION COLUMN CELL */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {/* Logic to check if already assigned */}
                       {assignments.some(a => a.user_id === u.id) ? (
                          <span className="text-green-600 font-medium">Assigned</span>
                       ) : (
                          <div className="flex gap-2 items-center">
                            <select 
                              className="border rounded px-2 py-1 text-xs"
                              onChange={(e) => setSelectedTest({ ...selectedTest, [u.id]: e.target.value })}
                              defaultValue=""
                            >
                              <option value="" disabled>Select</option>
                              {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <button 
                              onClick={() => handleAssign(u.id)}
                              className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                            >
                              Assign
                            </button>
                          </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;