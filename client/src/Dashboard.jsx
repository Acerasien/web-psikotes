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
  const [results, setResults] = useState([]); // NEW STATE
  const [searchTerm, setSearchTerm] = useState("");

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
  
  // NEW FETCH FUNCTION
  const fetchResults = async () => {
    try { 
      const r = await axios.get('http://127.0.0.1:8000/results/', { headers: { Authorization: `Bearer ${token}` } }); 
      setResults(r.data); 
    } catch (e) { console.error(e); }
  };

    // Filter users based on search term
  const filteredUsers = usersList
    .filter(u => u.role === 'participant') // Only show participants
    .filter(u => {
      if (!searchTerm) return true; // If no search, show all
      const name = (u.full_name || u.username).toLowerCase();
      const dept = (u.department || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || dept.includes(searchTerm.toLowerCase());
    });

  useEffect(() => { fetchUsers(); fetchTests(); fetchAssignments(); fetchResults(); }, []);

  const handleAssign = async (userId) => {
    const testId = selectedTest[userId];
    if (!testId) { alert("Select a test first"); return; }
    try {
      await axios.post(`http://127.0.0.1:8000/assignments/?user_id=${userId}&test_id=${testId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchAssignments(); 
    } catch (err) { alert("Error: " + (err.response?.data?.detail || "Unknown")); }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  const getUserAssignments = (userId) => assignments.filter(a => a.user_id === userId);
  const isTestAssigned = (userId, testId) => assignments.some(a => a.user_id === userId && a.test_id === testId);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button onClick={onLogout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
      {/* Section 1: Create User */}
        <CreateUser token={token} onUserCreated={fetchUsers} />

      {/* Section 2: Manage Users */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Participants</h3>
            
            {/* NEW: Search Input */}
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Search by name or dept..."
                className="border rounded px-3 py-1 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Tests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* CHANGE: map over filteredUsers instead of usersList */}
                {filteredUsers.map((u) => (
                  // ... existing table row code remains exactly the same ...
                  <tr key={u.id}>
                    {/* ... keep your existing td cells exactly as they are ... */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.full_name || u.username}</div>
                      <div className="text-sm text-gray-500">{u.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {/* ... existing assignment logic ... */}
                       <div className="flex flex-col gap-1">
                          {getUserAssignments(u.id).length > 0 ? getUserAssignments(u.id).map(a => (
                            <span key={a.id} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block">
                              {a.test_name}
                            </span>
                          )) : <span className="text-gray-400 text-xs">None</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {/* ... existing action logic ... */}
                       <div className="flex gap-2 items-center">
                         <select 
                           className="border rounded px-2 py-1 text-xs"
                           onChange={(e) => setSelectedTest({ ...selectedTest, [u.id]: e.target.value })}
                           defaultValue=""
                         >
                           <option value="" disabled>Select</option>
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

        {/* Section 3: Results (NEW) */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Latest Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No results yet.
                    </td>
                  </tr>
                )}
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {r.full_name || r.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {r.test_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {/* UPDATED LINE */}
                      {r.score} / {r.total_questions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(r.time_taken / 60)}m {r.time_taken % 60}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(r.completed_at).toLocaleDateString()}
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