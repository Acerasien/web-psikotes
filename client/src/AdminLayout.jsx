import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ParticipantsPage from './pages/ParticipantsPage';
import ResultsPage from './pages/ResultsPage';
import AddParticipantPage from './pages/AddParticipantPage';
import ParticipantProfilePage from './pages/ParticipantProfilePage';
import SecurityDashboard from './pages/SecurityDashboard';
import ManageAdmins from './pages/ManageAdmins';

function AdminLayout({ token, user, onLogout }) {
    const location = useLocation();

    return (
        <div className="min-h-screen flex bg-gray-100">

            {/* SIDEBAR */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="h-16 flex items-center justify-center border-b border-gray-800">
                    <h1 className="text-xl font-bold text-blue-400">Psych Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/participants"
                        className={`block py-2 px-4 rounded transition ${location.pathname.includes('/participants') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                    >
                        Participants
                    </Link>

                    {user.role === 'superadmin' && (
                        <>
                            <Link
                                to="/results"
                                className={`block py-2 px-4 rounded transition ${location.pathname === '/results' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                            >
                                Results
                            </Link>
                            <Link
                                to="/security"
                                className={`block py-2 px-4 rounded transition ${location.pathname === '/security' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                            >
                                Security
                            </Link>
                            <Link
                                to="/admins"
                                className={`block py-2 px-4 rounded transition ${location.pathname === '/admins' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                            >
                                Admins
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500">Logged in as:</p>
                    <p className="text-sm font-bold">{user.username}</p>
                    <button onClick={onLogout} className="mt-2 w-full text-left text-red-400 text-sm hover:text-red-300">
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white shadow flex items-center px-6 justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {location.pathname === '/participants' ? 'Manage Participants' : 'Test Results'}
                    </h2>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<ParticipantsPage token={token} currentUserRole={user.role} />} />
                        <Route path="/participants" element={<ParticipantsPage token={token} currentUserRole={user.role} />} />
                        <Route path="/participants/new" element={<AddParticipantPage token={token} currentUserRole={user.role} />} />
                        <Route path="/results" element={<ResultsPage token={token} currentUserRole={user.role} />} />
                        <Route path="/security" element={<SecurityDashboard token={token} currentUserRole={user.role} />} />
                        <Route path="/admins" element={<ManageAdmins token={token} currentUserRole={user.role} />} />
                        <Route path="/participants/:id" element={<ParticipantProfilePage token={token} currentUserRole={user.role} />} />
                    </Routes>
                </main>
            </div>

        </div>
    );
}

export default AdminLayout;