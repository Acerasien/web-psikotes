// client/src/ParticipantDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { api } from './utils/api';
import TestScreen from './TestScreen';
import TemperamentTest from './components/TemperamentTest';
import MemoryTest from './components/MemoryTest';
import LogicTest from './components/LogicTest';
import Tutorial from './components/Tutorial';
import DISCTest from './components/DISCTest';

function ParticipantDashboard({ onLogout }) {
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tutorialAssignment, setTutorialAssignment] = useState(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getMyAssignments();
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (assignment) => {
    // If test is pending and tutorial not completed, show tutorial first
    if (assignment.status === 'pending' && !assignment.pretest_completed) {
      setTutorialAssignment(assignment);
    } else {
      setActiveTest(assignment.id);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Priority 1: Show tutorial if one is pending
  if (tutorialAssignment) {
    return (
      <Tutorial
        assignmentId={tutorialAssignment.id}
        testCode={tutorialAssignment.test_code}
        testName={tutorialAssignment.test_name}
        onComplete={() => {
          setTutorialAssignment(null);
          setActiveTest(tutorialAssignment.id);
        }}
      />
    );
  }

  // Priority 2: Show active test if one is selected
  if (activeTest) {
    const activeAssignment = assignments.find(a => a.id === activeTest);
    if (!activeAssignment) return null; // Wait for assignments to load

    switch (activeAssignment.test_code) {
      case 'MEM':
        return (
          <MemoryTest
            assignmentId={activeTest}
            onFinish={() => {
              setActiveTest(null);
              fetchAssignments();
            }}
          />
        );
      case 'LOGIC':
        return (
          <LogicTest
            assignmentId={activeTest}
            onFinish={() => {
              setActiveTest(null);
              fetchAssignments();
            }}
          />
        );
      case 'TEMP': // Use consistent code from backend (TEMP for Temperament)
        return (
          <TemperamentTest
            assignmentId={activeTest}
            onFinish={() => {
              setActiveTest(null);
              fetchAssignments();
            }}
          />
        );
      case 'DISC':
        return (
          <DISCTest
            assignmentId={activeTest}
            onFinish={() => {
              setActiveTest(null);
              fetchAssignments();
            }}
          />
        );
      default:
        return (
          <TestScreen
            assignmentId={activeTest}
            onFinish={() => {
              setActiveTest(null);
              fetchAssignments();
            }}
          />
        );
    }
  }

  // Priority 3: Show the dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Psikotes Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Halo, <span className="font-semibold text-gray-900">{user.username}</span>
            </span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with greeting */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Assessment Saya</h2>
          <p className="text-gray-600 mt-1">Kerjakan tes yang tersedia di bawah ini</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-4">Memuat daftar tes...</p>
            </div>
          )}

          {!loading && assignments.length === 0 && (
            <div className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Belum Ada Tes</h3>
              <p className="text-gray-500">Saat ini belum ada tes yang ditugaskan kepada Anda.</p>
            </div>
          )}

          {assignments.map((a) => (
            <div
              key={a.id}
              className={`group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${a.status === 'completed' ? 'opacity-90' : ''
                }`}
            >
              {/* Status stripe */}
              <div className={`absolute top-0 left-0 w-1 h-full ${a.status === 'completed' ? 'bg-green-500' :
                a.status === 'in_progress' ? 'bg-yellow-500' :
                  a.status === 'locked' ? 'bg-red-500' :
                    'bg-blue-500'
                }`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {a.test_name}
                  </h3>

                  {/* Status badge – modern pill with icon */}
                  {a.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Selesai</span>
                    </span>
                  )}
                  {a.status === 'in_progress' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Sedang Berjalan</span>
                    </span>
                  )}
                  {a.status === 'locked' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>Terkunci</span>
                    </span>
                  )}
                  {a.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Belum Dimulai</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ditugaskan: {new Date(a.assigned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                <div className="flex justify-end">
                  {a.status === 'completed' || a.status === 'locked' ? (
                    <span className="text-sm text-gray-400 italic flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Tidak ada aksi
                    </span>
                  ) : (
                    <button
                      onClick={() => handleStartTest(a)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {a.status === 'in_progress' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Lanjutkan
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mulai
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ParticipantDashboard;