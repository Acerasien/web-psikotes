// client/src/ParticipantDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import TestScreen from './TestScreen'; // Import the new component

function ParticipantDashboard({ token, user, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [activeTest, setActiveTest] = useState(null); // State to track active test

  useEffect(() => {
    // ... existing fetch logic ...
    const fetchAssignments = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/users/me/assignments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments(res.data);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      }
    };
    fetchAssignments();
  }, [token]);

  // If a test is active, show TestScreen
  if (activeTest) {
    return <TestScreen token={token} assignmentId={activeTest} onFinish={() => {
        setActiveTest(null); // Clear active test
        // Optional: Refresh assignments to show 'completed' status
        window.location.reload(); 
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">My Assessments</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button onClick={onLogout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-10">No tests assigned yet.</p>
          )}
          
                    {assignments.map((a) => (
            <div key={a.id} className={`bg-white overflow-hidden shadow rounded-lg ${a.status === 'completed' ? 'opacity-75 border-l-4 border-green-500' : ''}`}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{a.test_name}</h3>
                  
                  {/* Improved Status Badge */}
                  {a.status === 'completed' ? (
                    <span className="flex items-center text-green-600 font-bold text-sm">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Completed
                    </span>
                  ) : (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      a.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {a.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Assigned: {new Date(a.assigned_at).toLocaleDateString()}
                </p>
              </div>
              
              {/* Footer Logic */}
              <div className="px-5 py-3 bg-gray-50 text-right">
                {a.status === 'completed' ? (
                  <span className="text-sm text-gray-500 italic">No actions available</span>
                ) : (
                  <button 
                    onClick={() => setActiveTest(a.id)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                  >
                    {a.status === 'in_progress' ? 'Continue Test' : 'Start Test'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

export default ParticipantDashboard;