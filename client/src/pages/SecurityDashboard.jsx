// client/src/pages/SecurityDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { formatLocalDateTime } from '../utils/dateUtils';

function SecurityDashboard() {
    const { token } = useAuth();
    const [exitLogs, setExitLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search state
    const [logsSearch, setLogsSearch] = useState('');

    // Sorting state
    const [logsSort, setLogsSort] = useState({ key: 'timestamp', direction: 'desc' });

    // Pagination state
    const [logsPage, setLogsPage] = useState(1);
    const [logsPageSize, setLogsPageSize] = useState(10);

    const fetchExitLogs = async () => {
        try {
            const res = await api.getExitLogs();
            setExitLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch exit logs', err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchExitLogs();
            setLoading(false);
        };
        loadData();
    }, []);

    // --- Filtering ---
    const filterBySearch = (item, searchTerm) => {
        if (!searchTerm) return true;
        const name = (item.full_name || item.username || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    };

    // --- Sorting ---
    const sortLogs = (a, b) => {
        const { key, direction } = logsSort;
        let valA, valB;
        if (key === 'timestamp') {
            valA = new Date(a.timestamp);
            valB = new Date(b.timestamp);
        } else if (key === 'participant') {
            valA = (a.full_name || a.username || '').toLowerCase();
            valB = (b.full_name || b.username || '').toLowerCase();
        } else if (key === 'test_name') {
            valA = a.test_name || '';
            valB = b.test_name || '';
        } else {
            return 0;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    };

    // Apply filters and sorts
    const filteredLogs = (Array.isArray(exitLogs) ? exitLogs : [])
        .filter(log => filterBySearch(log, logsSearch))
        .sort(sortLogs);

    // Paginate
    const paginatedLogs = filteredLogs.slice(
        (logsPage - 1) * logsPageSize,
        logsPage * logsPageSize
    );

    const handleLogsSort = (key) => {
        setLogsSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Reset page when search changes
    useEffect(() => {
        setLogsPage(1);
    }, [logsSearch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-neutral-100 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-neutral-500 font-medium tracking-tight uppercase font-black text-xs">Memuat data keamanan...</p>
                </div>
            </div>
        );
    }

    // Pagination component helper
    const PaginationControls = ({ page, setPage, pageSize, setPageSize, totalItems }) => {
        const totalPages = Math.ceil(totalItems / pageSize);
        return (
            <div className="px-6 py-4 bg-white border-t border-neutral-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Baris:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border-2 border-neutral-100 rounded-lg px-2 py-1 text-xs font-black focus:ring-0 focus:border-primary-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                        {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalItems)} DARI {totalItems}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="p-2 border-2 border-neutral-100 rounded-lg disabled:opacity-30 hover:bg-neutral-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 border-2 border-neutral-100 rounded-lg disabled:opacity-30 hover:bg-neutral-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Keamanan & Log</h2>
                    <p className="text-neutral-500 text-sm">Monitor integritas pengujian dan aktivitas mencurigakan.</p>
                </div>
            </div>

            {/* Exit Logs Section */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-error-light rounded-xl">
                            <svg className="w-5 h-5 text-error-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="font-black text-neutral-900 uppercase tracking-tight">Log Keluar (Browser Exit)</h3>
                    </div>

                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari peserta..."
                            value={logsSearch}
                            onChange={(e) => setLogsSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-neutral-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-sm font-bold transition-all outline-none w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-neutral-100">
                    {paginatedLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-neutral-400 font-black uppercase text-xs tracking-widest">Tidak ada log keluar ditemukan</p>
                        </div>
                    ) : (
                        paginatedLogs.map(log => (
                            <div key={log.id} className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-black text-neutral-900 uppercase text-sm truncate">{log.full_name || log.username}</p>
                                        <p className="text-xs font-black text-primary-600 uppercase tracking-wider">{log.test_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest pt-2 border-t border-neutral-50">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatLocalDateTime(log.timestamp, 'dd MMM yyyy HH:mm:ss')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50">
                                <th
                                    className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary-600 transition-colors"
                                    onClick={() => handleLogsSort('participant')}
                                >
                                    <div className="flex items-center gap-2">
                                        Peserta
                                        {logsSort.key === 'participant' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary-600 transition-colors"
                                    onClick={() => handleLogsSort('test_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Pengujian
                                        {logsSort.key === 'test_name' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-primary-600 transition-colors"
                                    onClick={() => handleLogsSort('timestamp')}
                                >
                                    <div className="flex items-center gap-2">
                                        Waktu Kejadian
                                        {logsSort.key === 'timestamp' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center">
                                        <p className="text-neutral-400 font-black uppercase text-xs tracking-widest italic">Belum ada aktivitas mencurigakan yang tercatat.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-neutral-900 uppercase text-xs tracking-tight">
                                                {log.full_name || log.username}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-primary-50 text-primary-700 uppercase tracking-wider">
                                                {log.test_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-[11px] font-bold text-neutral-500">
                                                {formatLocalDateTime(log.timestamp, 'dd MMM yyyy HH:mm:ss')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <PaginationControls
                    page={logsPage}
                    setPage={setLogsPage}
                    pageSize={logsPageSize}
                    setPageSize={setLogsPageSize}
                    totalItems={filteredLogs.length}
                />
            </div>
        </div>
    );
}

export default SecurityDashboard;
