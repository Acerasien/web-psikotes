// client/src/pages/SecurityDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { format } from 'date-fns'; // for nice date formatting

function SecurityDashboard({ token }) {
    const [lockedAssignments, setLockedAssignments] = useState([]);
    const [exitLogs, setExitLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch locked assignments
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

    // Fetch exit logs (initially no filters)
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

    // Load both on component mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchLocked(), fetchExitLogs()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // Handler for unlocking
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
                // Refresh the locked assignments list
                fetchLocked();
            } catch (err) {
                Swal.fire('Error', 'Could not unlock assignment.', 'error');
            }
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading security data...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Locked Assignments Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Locked Assignments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lockedAssignments.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No locked assignments.</td></tr>
                            ) : (
                                lockedAssignments.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {a.full_name || a.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.test_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(a.assigned_at), 'dd MMM yyyy')}
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
            </div>

            {/* Exit Logs Section – we'll build next */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Exit Logs</h3>
                </div>
                {/* We'll add a simple table here, maybe with filters later */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {exitLogs.length === 0 ? (
                                <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No exit logs.</td></tr>
                            ) : (
                                exitLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.full_name || log.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.test_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SecurityDashboard;