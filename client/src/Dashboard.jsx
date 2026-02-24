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

  // ... (Keep existing useEffect and fetch functions exactly as they were) ...
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) { onLogout(); }
    };
    fetchUser();
  }, [token]);

  const fetchUsers = async () => {
    try { const r = await axios.get('http://127.0.0.1:8000/users/', { headers: { Authorization: `Bearer ${token}` } }); setUsersList(r.data); } catch (e) { console.error(e); }
  };
  const fetchTests = async () => {
    try { const r = await axios.get('http://127.0.0.1:8000/tests/', { headers: { Authorization: `Bearer ${token}` } }); setTests(r.data); } catch (e) { console.error(e); }
  };
  const fetchAssignments = async () => {
    try { const r = await axios.get('http://127.0.0.1:8000/assignments/', { headers: { Authorization: `Bearer ${token}` } }); setAssignments(r.data); } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); fetchTests(); fetchAssignments(); }, []);

  const handleAssign = async (userId) => {
    const testId = selectedTest[userId];
    if (!testId) { alert("Select a test first"); return; }
    try {
      await axios.post(`http://127.0.0.1:8000/assignments/?user_id=${userId}&test_id=${testId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchAssignments(); 
    } catch (err) { alert("Error: " + (err.response?.data?.detail || "Unknown")); }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  // Helper: Get assignments for a specific user
  const getUserAssignments = (userId) => {
    return assignments.filter(a => a.user_id === userId);
  };

  // Helper: Check if a specific test is already assigned to a user
  const isTestAssigned = (userId, testId) => {
    return assignments.some(a => a.user_id === userId && a.test_id === testId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Psych Test Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button onClick={onLogout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Tests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.full_name || u.username}</div>
                      <div className="text-sm text-gray-500">{u.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.position || '-'}</td>
                    
                    {/* NEW: Show list of assigned tests */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserAssignments(u.id).length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {getUserAssignments(u.id).map(a => (
                            <span key={a.id} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {a.test_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>

                    {/* NEW: Improved Assign Logic */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2 items-center">
                        <select 
                          className="border rounded px-2 py-1 text-xs"
                          onChange={(e) => setSelectedTest({ ...selectedTest, [u.id]: e.target.value })}
                          defaultValue=""
                        >
                          <option value="" disabled>Select</option>
                          {/* Only show tests that are NOT already assigned */}
                          {tests.filter(t => !isTestAssigned(u.id, t.id)).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleAssign(u.id)}
                          className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                        >
                          Add
                        </button>
                      </div>
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