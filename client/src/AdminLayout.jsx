import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ParticipantsPage from './pages/ParticipantsPage';
import ResultsPage from './pages/ResultsPage';
import AddParticipantPage from './pages/AddParticipantPage';
import ParticipantProfilePage from './pages/ParticipantProfilePage';
import SecurityDashboard from './pages/SecurityDashboard';
import ManageAdmins from './pages/ManageAdmins';
import Dashboard from './pages/Dashboard';  // new import

function AdminLayout({ token, user, onLogout }) {
    const location = useLocation();

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* SIDEBAR – redesigned */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                {/* User info at the top */}
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="mt-3 w-full text-left text-sm text-red-400 hover:text-red-300 bg-gray-800 px-3 py-2 rounded"
                    >
                        Logout
                    </button>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        to="/"
                        className={`block py-2 px-4 rounded transition ${location.pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-800'
                            }`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/participants"
                        className={`block py-2 px-4 rounded transition ${location.pathname.startsWith('/participants') ? 'bg-blue-600' : 'hover:bg-gray-800'
                            }`}
                    >
                        Participants
                    </Link>
                    {user.role === 'superadmin' && (
                        <>
                            <Link
                                to="/admins"
                                className={`block py-2 px-4 rounded transition ${location.pathname === '/admins' ? 'bg-blue-600' : 'hover:bg-gray-800'
                                    }`}
                            >
                                Admins
                            </Link>
                            <Link
                                to="/results"
                                className={`block py-2 px-4 rounded transition ${location.pathname === '/results' ? 'bg-blue-600' : 'hover:bg-gray-800'
                                    }`}
                            >
                                Results
                            </Link>
                            <Link
                                to="/security"
                                className={`block py-2 px-4 rounded transition ${location.pathname === '/security' ? 'bg-blue-600' : 'hover:bg-gray-800'
                                    }`}
                            >
                                Security
                            </Link>
                        </>
                    )}
                </nav>

                {/* Old footer removed – user info moved to top */}
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white shadow flex items-center px-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {/* Dynamic title based on route – optional */}
                        {location.pathname === '/' && 'Dashboard'}
                        {location.pathname.startsWith('/participants') && 'Manage Participants'}
                        {location.pathname === '/admins' && 'Manage Admins'}
                        {location.pathname === '/results' && 'Test Results'}
                        {location.pathname === '/security' && 'Security Dashboard'}
                    </h2>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard token={token} currentUserRole={user.role} />} />
                        <Route path="/participants" element={<ParticipantsPage token={token} currentUserRole={user.role} />} />
                        <Route path="/participants/new" element={<AddParticipantPage token={token} currentUserRole={user.role} />} />
                        <Route path="/participants/:id" element={<ParticipantProfilePage token={token} currentUserRole={user.role} />} />
                        <Route path="/admins" element={<ManageAdmins token={token} currentUserRole={user.role} />} />
                        <Route path="/results" element={<ResultsPage token={token} currentUserRole={user.role} />} />
                        <Route path="/security" element={<SecurityDashboard token={token} currentUserRole={user.role} />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;