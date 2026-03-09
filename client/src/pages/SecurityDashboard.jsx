// client/src/pages/SecurityDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { formatLocalDateTime } from '../utils/dateUtils';

function SecurityDashboard({ token }) {
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
            const res = await axios.get('http://127.0.0.1:8000/admin/locked-assignments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLockedAssignments(res.data);
        } catch (err) {
            console.error('Failed to fetch locked assignments', err);
        }
    };

    const fetchExitLogs = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/admin/exit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            title: 'Unlock this assignment?',
            text: 'The participant will be able to resume the test.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, unlock',
            cancelButtonText: 'Cancel'
        });
        if (result.isConfirmed) {
            try {
                await axios.post(`http://127.0.0.1:8000/admin/assignments/${assignmentId}/unlock`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Unlocked!', 'The assignment has been unlocked.', 'success');
                fetchLocked();
            } catch (err) {
                Swal.fire('Error', 'Could not unlock assignment.', 'error');
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
    const filteredLocked = lockedAssignments
        .filter(a => filterBySearch(a, lockedSearch))
        .sort(sortLocked);

    const filteredLogs = exitLogs
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
        return <div className="p-8 text-center">Loading security data...</div>;
    }

    // Pagination component helper
    const PaginationControls = ({ page, setPage, pageSize, setPageSize, totalItems }) => {
        const totalPages = Math.ceil(totalItems / pageSize);
        return (
            <div className="px-4 py-3 bg-white border-t flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Rows per page:</span>
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
                        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                        >
                            Next
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Locked Assignments</h3>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <input
                        type="text"
                        placeholder="Search by participant name..."
                        value={lockedSearch}
                        onChange={(e) => setLockedSearch(e.target.value)}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLockedSort('participant')}
                                >
                                    Participant {lockedSort.key === 'participant' && (lockedSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLockedSort('test_name')}
                                >
                                    Test {lockedSort.key === 'test_name' && (lockedSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLockedSort('assigned_at')}
                                >
                                    Assigned Date {lockedSort.key === 'assigned_at' && (lockedSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLocked.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No locked assignments.</td></tr>
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
                                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
                                            >
                                                Unlock
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Exit Logs</h3>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <input
                        type="text"
                        placeholder="Search by participant name..."
                        value={logsSearch}
                        onChange={(e) => setLogsSearch(e.target.value)}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLogsSort('participant')}
                                >
                                    Participant {logsSort.key === 'participant' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLogsSort('test_name')}
                                >
                                    Test {logsSort.key === 'test_name' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleLogsSort('timestamp')}
                                >
                                    Timestamp {logsSort.key === 'timestamp' && (logsSort.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.length === 0 ? (
                                <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No exit logs.</td></tr>
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