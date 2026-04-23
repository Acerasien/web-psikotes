// client/src/pages/SecurityDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { formatLocalDateTime } from '../utils/dateUtils';

function SecurityDashboard() {
    const { token } = useAuth();
    const [lockedAssignments, setLockedAssignments] = useState([]);
    const [exitLogs, setExitLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search state
    const [lockedSearch, setLockedSearch] = useState('');
    const [logsSearch, setLogsSearch] = useState('');

    // Sorting state
    const [lockedSort, setLockedSort] = useState({ key: 'assigned_at', direction: 'desc' });
    const [logsSort, setLogsSort] = useState({ key: 'timestamp', direction: 'desc' });

    // Pagination state
    const [lockedPage, setLockedPage] = useState(1);
    const [lockedPageSize, setLockedPageSize] = useState(10);
    const [logsPage, setLogsPage] = useState(1);
    const [logsPageSize, setLogsPageSize] = useState(10);

    const fetchLocked = async () => {
        try {
            const res = await api.getLockedAssignments();
            setLockedAssignments(res.data);
        } catch (err) {
            console.error('Failed to fetch locked assignments', err);
        }
    };

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
            await Promise.all([fetchLocked(), fetchExitLogs()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const handleUnlock = async (assignmentId) => {
        const result = await Swal.fire({
            title: 'Buka kunci penugasan ini?',
            text: 'Peserta dapat melanjutkan tes.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, buka kunci',
            cancelButtonText: 'Batal'
        });
        if (result.isConfirmed) {
            try {
                await api.unlockAssignment(assignmentId);
                Swal.fire('Berhasil dibuka!', 'Penugasan telah dibuka kuncinya.', 'success');
                fetchLocked();
            } catch (err) {
                Swal.fire('Kesalahan', 'Gagal membuka kunci penugasan.', 'error');
            }
        }
    };

    // --- Filtering ---
    const filterBySearch = (item, searchTerm) => {
        if (!searchTerm) return true;
        const name = (item.full_name || item.username || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    };

    // --- Sorting ---
    const sortLocked = (a, b) => {
        const { key, direction } = lockedSort;
        let valA, valB;
        if (key === 'assigned_at') {
            valA = new Date(a.assigned_at);
            valB = new Date(b.assigned_at);
        } else if (key === 'test_name') {
            valA = a.test_name || '';
            valB = b.test_name || '';
        } else if (key === 'participant') {
            valA = (a.full_name || a.username || '').toLowerCase();
            valB = (b.full_name || b.username || '').toLowerCase();
        } else {
            return 0;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    };

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
    const filteredLocked = (Array.isArray(lockedAssignments) ? lockedAssignments : [])
        .filter(a => filterBySearch(a, lockedSearch))
        .sort(sortLocked);

    const filteredLogs = (Array.isArray(exitLogs) ? exitLogs : [])
        .filter(log => filterBySearch(log, logsSearch))
        .sort(sortLogs);

    // Paginate
    const paginatedLocked = filteredLocked.slice(
        (lockedPage - 1) * lockedPageSize,
        lockedPage * lockedPageSize
    );
    const paginatedLogs = filteredLogs.slice(
        (logsPage - 1) * logsPageSize,
        logsPage * logsPageSize
    );

    const handleLockedSort = (key) => {
        setLockedSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleLogsSort = (key) => {
        setLogsSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Reset page when search changes
    useEffect(() => {
        setLockedPage(1);
    }, [lockedSearch]);

    useEffect(() => {
        setLogsPage(1);
    }, [logsSearch]);

    if (loading) {
        return <div className="p-8 text-center">Memuat data keamanan...</div>;
    }

    // Pagination component helper
    const PaginationControls = ({ page, setPage, pageSize, setPageSize, totalItems }) => {
        const totalPages = Math.ceil(totalItems / pageSize);
        return (
            <div className="px-4 py-3 bg-white border-t flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Baris per halaman:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                        Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} dari {totalItems}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                        >
                            Sebelumnya
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Locked Assignments Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Penugasan Terkunci</h3>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama peserta..."
                        value={lockedSearch}
                        onChange={(e) => setLockedSearch(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Mobile Card View - shows on screens < lg */}
                <div className="lg:hidden divide-y divide-gray-200">
                    {paginatedLocked.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <p>Tidak ada penugasan terkunci ditemukan</p>
                        </div>
                    ) : (
                        paginatedLocked.map(a => (
                            <div key={a.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate" title={a.full_name || a.username}>{a.full_name || a.username}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate" title={a.test_name}>{a.test_name}</p>
                                    </div>
                                    <button
                                        onClick={() => handleUnlock(a.id)}
                                        className="flex-shrink-0 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm min-h-[44px]"
                                    >
                                        Buka Kunci
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatLocalDateTime(a.assigned_at, 'dd MMM yyyy')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table - hidden on mobile */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLockedSort('participant')}
                                >
                                    Peserta {lockedSort.key === 'participant' && (lockedSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLockedSort('test_name')}
                                >
                                    Tes {lockedSort.key === 'test_name' && (lockedSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLockedSort('assigned_at')}
                                >
                                    Tanggal Penugasan {lockedSort.key === 'assigned_at' && (lockedSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLocked.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Tidak ada penugasan terkunci.</td></tr>
                            ) : (
                                paginatedLocked.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {a.full_name || a.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.test_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatLocalDateTime(a.assigned_at, 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleUnlock(a.id)}
                                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm min-h-[44px]"
                                            >
                                                Buka Kunci
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination for locked assignments */}
                <PaginationControls
                    page={lockedPage}
                    setPage={setLockedPage}
                    pageSize={lockedPageSize}
                    setPageSize={setLockedPageSize}
                    totalItems={filteredLocked.length}
                />
            </div>

            {/* Exit Logs Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Log Keluar</h3>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama peserta..."
                        value={logsSearch}
                        onChange={(e) => setLogsSearch(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Mobile Card View - shows on screens < lg */}
                <div className="lg:hidden divide-y divide-gray-200">
                    {paginatedLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>Tidak ada log keluar ditemukan</p>
                        </div>
                    ) : (
                        paginatedLogs.map(log => (
                            <div key={log.id} className="p-4 space-y-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate" title={log.full_name || log.username}>{log.full_name || log.username}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate" title={log.test_name}>{log.test_name}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatLocalDateTime(log.timestamp, 'dd MMM yyyy HH:mm:ss')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table - hidden on mobile */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLogsSort('participant')}
                                >
                                    Peserta {logsSort.key === 'participant' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLogsSort('test_name')}
                                >
                                    Tes {logsSort.key === 'test_name' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLogsSort('timestamp')}
                                >
                                    Waktu {logsSort.key === 'timestamp' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.length === 0 ? (
                                <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Tidak ada log keluar.</td></tr>
                            ) : (
                                paginatedLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.full_name || log.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.test_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatLocalDateTime(log.timestamp, 'dd MMM yyyy HH:mm:ss')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination for exit logs */}
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
