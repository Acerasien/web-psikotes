// client/src/ParticipantDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { api } from './utils/api';
import Tutorial from './components/Tutorial';

function ParticipantDashboard({ onLogout }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tutorialAssignment, setTutorialAssignment] = useState(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getMyAssignments();

      // Sort assignments: in_progress > pending > locked > completed
      const statusWeight = {
        'in_progress': 1,
        'pending': 2,
        'locked': 3,
        'completed': 4
      };

      const sortedAssignments = res.data.sort((a, b) => {
        // First sort by status
        const weightA = statusWeight[a.status] || 99;
        const weightB = statusWeight[b.status] || 99;

        if (weightA !== weightB) {
          return weightA - weightB;
        }

        // Then sort by ID or assigned_at as tie-breaker
        return new Date(b.assigned_at) - new Date(a.assigned_at);
      });

      setAssignments(sortedAssignments);
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
      // Navigate to test route
      navigate(`/test/${assignment.id}`);
    }
  };

  const handleTutorialComplete = () => {
    if (tutorialAssignment) {
      navigate(`/test/${tutorialAssignment.id}`);
      setTutorialAssignment(null);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Show tutorial if one is pending
  if (tutorialAssignment) {
    return (
      <Tutorial
        assignmentId={tutorialAssignment.id}
        testCode={tutorialAssignment.test_code}
        testName={tutorialAssignment.test_name}
        onComplete={handleTutorialComplete}
      />
    );
  }

  // Priority 3: Show the dashboard
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/Logo_Login_2.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-bold text-neutral-900 font-display">
              Psikotes Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500 hidden sm:block">
              Halo, <span className="font-semibold text-neutral-900">{user.username}</span>
            </span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-error hover:text-error-dark bg-error-light hover:bg-error-light/70 rounded-lg transition-colors"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-700 to-[#d3c0aa] rounded-2xl p-8 mb-8 text-white shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold font-display mb-2 flex items-baseline gap-3">
              Assessment Saya
              <span className="text-sm font-normal text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                {user.full_name || user.username}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 text-sm font-medium">
              <span className="flex items-center gap-1.5 grayscale opacity-80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {user.department || 'No Department'}
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:block"></span>
              <span className="flex items-center gap-1.5 grayscale opacity-80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.business_unit || 'No Business Unit'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              <p className="text-neutral-700 mt-4">Memuat daftar tes...</p>
            </div>
          )}

          {!loading && assignments.length === 0 && (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-neutral-200">
              <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">Belum Ada Tes</h3>
              <p className="text-neutral-700">Saat ini belum ada tes yang ditugaskan kepada Anda.</p>
            </div>
          )}

          {assignments.map((a) => (
            <div
              key={a.id}
              className={`group bg-white rounded-2xl relative transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden border border-neutral-200 border-l-[6px] ${a.status === 'completed' ? 'opacity-80 border-l-success' :
                a.status === 'in_progress' ? 'border-l-warning' :
                  a.status === 'locked' ? 'border-l-error' :
                    'border-l-primary-700'
                }`}
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  {/* Rounded Icon Box */}
                  <div className="w-16 h-16 rounded-2xl bg-accent-gold-light border border-accent-gold/20 flex items-center justify-center text-accent-gold shadow-sm shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0 mt-2">
                    {a.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-success-light text-success-dark">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Selesai</span>
                      </span>
                    )}
                    {a.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-warning-light text-warning-dark">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sedang Berjalan</span>
                      </span>
                    )}
                    {a.status === 'locked' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-error-light text-error-dark">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Terkunci</span>
                      </span>
                    )}
                    {a.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-neutral-200/60 text-primary-700">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>Belum Dimulai</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors font-display mb-3">
                    {a.test_name}
                  </h3>

                  <div className="space-y-2.5">
                    <p className="text-[15px] font-medium text-neutral-500 flex items-center gap-2">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ditugaskan: {new Date(a.assigned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[15px] font-medium text-neutral-500 flex items-center gap-2">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Waktu yang dibutuhkan: ~{a.duration || '20'} Menit
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  {a.status === 'completed' || a.status === 'locked' ? (
                    <div className="w-full py-3.5 bg-neutral-100 rounded-xl flex items-center justify-center text-[15px] text-neutral-500 font-medium italic gap-2 border border-neutral-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Tidak ada aksi
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartTest(a)}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 btn-primary shadow-sm rounded-xl text-[15px]"
                    >
                      {a.status === 'in_progress' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Lanjutkan
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Participant Footer (Luxury Minimalist Theme) */}
      <footer className="bg-primary-900 text-white pt-8 pb-6 mt-auto border-t border-primary-800 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 lg:gap-16">
            
            {/* Left Section - Logo & Address */}
            <div className="max-w-xl">
              <img src="/logo-h.png" alt="Andamas Group Logo" className="h-8 sm:h-9 mb-4 object-contain" />
              <div>
                <h4 className="text-accent-gold font-display tracking-[0.2em] text-[11px] font-bold mb-2 uppercase">
                  KANTOR PUSAT
                </h4>
                <p className="text-gray-300 text-[13px] leading-relaxed max-w-lg font-light">
                  Altira Business Park, Jl. Yos Sudarso Kav 85, Sunter Jaya, Kec. Tj. Priok,<br className="hidden sm:block" /> 
                  Jkt Utara, Daerah Khusus Ibukota Jakarta 14360 Lantai 23B & 25B-D<br className="hidden sm:block" />
                  Andamas Group
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col sm:flex-row gap-8 md:gap-16 sm:min-w-fit">
              {/* Social Media */}
              <div>
                <h4 className="text-accent-gold font-display tracking-[0.2em] text-[11px] font-bold mb-3 uppercase">
                  SOSIAL MEDIA
                </h4>
                <div className="flex gap-3">
                  <a href="https://www.instagram.com/andamasgroup/" className="w-[30px] h-[30px] bg-white text-black rounded-full flex items-center justify-center hover:bg-accent-gold hover:text-white transition-all transform hover:-translate-y-0.5 shadow-sm">
                    {/* Instagram */}
                    <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/andamas-group/" className="w-[30px] h-[30px] bg-white text-black rounded-full flex items-center justify-center hover:bg-accent-gold hover:text-white transition-all transform hover:-translate-y-0.5 shadow-sm">
                    {/* LinkedIn */}
                    <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://www.youtube.com/@andamasgroup" className="w-[30px] h-[30px] bg-white text-black rounded-full flex items-center justify-center hover:bg-accent-gold hover:text-white transition-all transform hover:-translate-y-0.5 shadow-sm">
                    {/* YouTube */}
                    <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 00-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 002.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-accent-gold font-display tracking-[0.2em] text-[11px] font-bold mb-3 uppercase">
                  KONTAK KAMI
                </h4>
                <div className="flex flex-col gap-2 font-light">
                  <div className="flex items-center gap-2.5 text-gray-300 text-[13px]">
                    <svg className="w-[16px] h-[16px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+62 21 4587 0002</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-300 text-[13px]">
                    <svg className="w-[16px] h-[16px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:info@andamas.id" className="hover:text-white transition-colors">info@andamas.id</a>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ParticipantDashboard;