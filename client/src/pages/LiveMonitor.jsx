// client/src/pages/LiveMonitor.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import PageWrapper from '../components/PageWrapper';

function LiveMonitor() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [nextRefresh, setNextRefresh] = useState(15);
    const [changedIds, setChangedIds] = useState(new Set());

    const prevSessionsRef = useRef([]);

    const fetchData = async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const res = await api.getLiveStats();
            const newData = res.data || [];

            // Detect changes for "blinking"
            const newChangedIds = new Set();
            if (prevSessionsRef.current.length > 0) {
                newData.forEach(session => {
                    const prev = prevSessionsRef.current.find(p => p.id === session.id);
                    if (prev && session.answered_count > prev.answered_count) {
                        newChangedIds.add(session.id);
                    }
                });
            }

            setSessions(newData);
            setChangedIds(newChangedIds);
            setLastUpdated(new Date());
            setNextRefresh(15);
            prevSessionsRef.current = newData;

            // Clear changed IDs after animation
            if (newChangedIds.size > 0) {
                setTimeout(() => setChangedIds(new Set()), 3000);
            }
        } catch (err) {
            console.error('Failed to load live stats', err);
            setError(isInitial ? (err.message || 'Gagal memuat data live') : null);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);

        const timer = setInterval(() => {
            setNextRefresh(prev => {
                if (prev <= 1) {
                    fetchData();
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatRemainingTime = (total, elapsed) => {
        const remaining = total - elapsed;
        if (remaining <= 0) return '0m';
        const m = Math.floor(remaining / 60);
        return `${m}m`;
    };

    return (
        <PageWrapper
            loading={loading}
            error={error}
            onRetry={() => fetchData(true)}
            loadingText="Membuka pusat pemantauan..."
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-neutral-900 font-display">Live View </h1>
                            <span className="px-2 py-0.5 bg-error-light text-error text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse border border-error/20">
                                Live
                            </span>
                        </div>
                        <p className="text-neutral-500 font-medium">Memantau Aktivitas Peserta</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active Participants */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Peserta Aktif</p>
                        <p className="text-2xl font-black text-neutral-900">{sessions.length}</p>
                    </div>

                    {/* Average Progress */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Rata-rata Progres</p>
                        <p className="text-2xl font-black text-primary-600">
                            {sessions.length > 0 
                                ? Math.round(sessions.reduce((acc, s) => acc + (s.progress_percent || 0), 0) / sessions.length) 
                                : 0}%
                        </p>
                    </div>

                    {/* Security Alerts */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Peringatan Keamanan</p>
                        <p className={`text-2xl font-black ${sessions.filter(s => s.last_event?.includes('Exit')).length > 0 ? 'text-error animate-pulse' : 'text-success'}`}>
                            {sessions.filter(s => s.last_event?.includes('Exit')).length}
                        </p>
                    </div>

                    {/* Last Update */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Pembaruan Terakhir</p>
                        <p className="text-2xl font-black text-neutral-900">
                            {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* Main Monitor Table */}
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Peserta</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Tes</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Progres</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Sisa Waktu</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Status Terakhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-neutral-400">
                                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="font-medium">Tidak ada peserta yang aktif saat ini.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr
                                            key={session.id}
                                            className={`transition-colors duration-1000 ${changedIds.has(session.id) ? 'bg-success-light/40' : 'hover:bg-neutral-50'
                                                } ${session.last_event.includes('Exit') ? 'border-l-4 border-l-warning' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                                                        {session.participant_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-neutral-900 text-sm">{session.participant_name}</p>
                                                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">{session.level}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100">
                                                    {session.test_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ease-out ${changedIds.has(session.id) ? 'bg-success' : 'bg-primary-500'
                                                                }`}
                                                            style={{ width: `${session.progress_percent}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-neutral-600 w-10">{session.progress_percent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-600">
                                                {formatRemainingTime(session.time_limit_seconds, session.time_elapsed_seconds)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${session.last_event.includes('Exit') ? 'bg-warning animate-pulse' : 'bg-success'
                                                        }`}></div>
                                                    <span className={`text-xs font-bold ${session.last_event.includes('Exit') ? 'text-warning-dark' : 'text-neutral-500'
                                                        }`}>
                                                        {session.last_event}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-neutral-400 italic">
                        * Data diperbarui secara otomatis setiap 15 detik. Baris akan berkedip hijau saat peserta menjawab soal baru.
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
}

export default LiveMonitor;
