import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import ParticipantsPage from './pages/ParticipantsPage';
import ResultsPage from './pages/ResultsPage';
import AddParticipantPage from './pages/AddParticipantPage';
import ParticipantProfilePage from './pages/ParticipantProfilePage';
import SecurityDashboard from './pages/SecurityDashboard';
import ManageAdmins from './pages/ManageAdmins';
import Dashboard from './pages/Dashboard';

function AdminLayout({ onLogout }) {
    const { user, isSuperadmin } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Redirect /dashboard to / for admin users
    if (location.pathname === '/dashboard') {
        return <Navigate to="/" replace />;
    }

    const navLinks = [
        { to: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { to: '/participants', label: 'Peserta', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    ];

    if (isSuperadmin) {
        navLinks.push(
            { to: '/admins', label: 'Admin', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { to: '/results', label: 'Hasil', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { to: '/security', label: 'Keamanan', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
        );
    }

    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'Dashboard';
        if (pathname.startsWith('/participants')) return 'Kelola Peserta';
        if (pathname === '/admins') return 'Kelola Admin';
        if (pathname === '/results') return 'Hasil Tes';
        if (pathname === '/security') return 'Dashboard Keamanan';
        return 'Panel Admin';
    };

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gray-900 text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* User info at the top */}
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="mt-3 w-full text-left text-sm text-red-400 hover:text-red-300 bg-gray-800 px-3 py-2 rounded transition-colors"
                    >
                        Keluar
                    </button>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setSidebarOpen(false)}
                            className={`block py-2.5 px-4 rounded transition flex items-center gap-3 ${
                                location.pathname === link.to || 
                                (link.to !== '/' && location.pathname.startsWith(link.to))
                                    ? 'bg-blue-600' 
                                    : 'hover:bg-gray-800'
                            }`}
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                            </svg>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="h-16 bg-white shadow flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        {/* Hamburger button - mobile only */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800">
                            {getPageTitle(location.pathname)}
                        </h2>
                    </div>
                    
                    {/* User badge - desktop */}
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.username}</span>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/participants" element={<ParticipantsPage />} />
                        <Route path="/participants/new" element={<AddParticipantPage />} />
                        <Route path="/participants/:id" element={<ParticipantProfilePage />} />
                        <Route path="/admins" element={<ManageAdmins />} />
                        <Route path="/results" element={<ResultsPage />} />
                        <Route path="/security" element={<SecurityDashboard />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;