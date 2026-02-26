import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import EditParticipantModal from '../components/EditParticipantModal';

function ParticipantsPage({ token }) {
    const [usersList, setUsersList] = useState([]);
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedTest, setSelectedTest] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Helper functions
    const getUserAssignments = (userId) => assignments.filter(a => a.user_id === userId);
    const isTestAssigned = (userId, testId) => assignments.some(a => a.user_id === userId && a.test_id === testId);

    // Fetch tests
    const fetchTests = async () => {
        try {
            const r = await axios.get('http://127.0.0.1:8000/tests/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTests(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    // Refresh assignments
    const refreshAssignments = async () => {
        try {
            const r = await axios.get('http://127.0.0.1:8000/assignments/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    // Refresh users
    const refreshUsers = async () => {
        try {
            const r = await axios.get('http://127.0.0.1:8000/users/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsersList(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    // Initial data load
    useEffect(() => {
        refreshUsers();
        fetchTests();
        refreshAssignments();
    }, [token]);

    // Filtering
    const filteredUsers = usersList
        .filter(u => u.role === 'participant')
        .filter(u => {
            if (!searchTerm) return true;
            const name = (u.full_name || u.username).toLowerCase();
            const dept = (u.department || "").toLowerCase();
            return name.includes(searchTerm.toLowerCase()) || dept.includes(searchTerm.toLowerCase());
        });

    // Pagination
    const indexOfLastUser = currentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    const handleAssign = async (userId, e) => {
        e.stopPropagation();
        const testId = selectedTest[userId];
        if (!testId) {
            Swal.fire("Error", "Select a test first", "error");
            return;
        }
        try {
            await axios.post(`http://127.0.0.1:8000/assignments/?user_id=${userId}&test_id=${testId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refreshAssignments();
            setSelectedTest(prev => ({ ...prev, [userId]: '' }));
        } catch (err) {
            Swal.fire("Error", err.response?.data?.detail || "Unknown", "error");
        }
    };

    const handleUnlock = async (assignmentId, e) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Unlock this test?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, unlock'
        });
        if (result.isConfirmed) {
            try {
                await axios.post(`http://127.0.0.1:8000/admin/assignments/${assignmentId}/unlock`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                refreshAssignments();
                Swal.fire('Unlocked!', '', 'success');
            } catch (err) {
                Swal.fire('Error', 'Could not unlock', 'error');
            }
        }
    };

    const handleDelete = async (userId, userName) => {
        const result = await Swal.fire({
            title: 'Delete Participant?',
            text: `Are you sure you want to delete ${userName}? This will permanently remove all their data.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://127.0.0.1:8000/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Deleted!', 'Participant has been deleted.', 'success');
                refreshUsers();
            } catch (err) {
                Swal.fire('Error', 'Could not delete participant.', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Button and Search */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Participants</h3>
                    <Link to="/participants/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">
                        + Add Participant
                    </Link>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border rounded px-3 py-1 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentUsers.map((u) => (
                                <tr
                                    key={u.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/participants/${u.id}`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{u.full_name || u.username}</div>
                                        <div className="text-sm text-gray-500">{u.username}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.department || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            {getUserAssignments(u.id).length > 0 ? (
                                                getUserAssignments(u.id).map(a => (
                                                    <span
                                                        key={a.id}
                                                        className={`px-2 py-1 rounded text-xs inline-block ${a.status === 'locked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                            }`}
                                                    >
                                                        {a.test_name} ({a.status})
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-xs">None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex gap-2 items-center">
                                            {getUserAssignments(u.id).some(a => a.status === 'locked') && (
                                                <button
                                                    onClick={(e) => {
                                                        const lockedA = getUserAssignments(u.id).find(a => a.status === 'locked');
                                                        handleUnlock(lockedA.id, e);
                                                    }}
                                                    className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                                                >
                                                    Unlock
                                                </button>
                                            )}
                                            <select
                                                className="border rounded px-2 py-1 text-xs"
                                                value={selectedTest[u.id] || ''}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTest({ ...selectedTest, [u.id]: e.target.value });
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="" disabled>Select test</option>
                                                {tests
                                                    .filter(t => !isTestAssigned(u.id, t.id))
                                                    .map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                            </select>
                                            <button
                                                onClick={(e) => handleAssign(u.id, e)}
                                                className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                                            >
                                                Add
                                            </button>
                                            {/* Edit button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingUser(u);
                                                    setShowEditModal(true);
                                                }}
                                                className="bg-yellow-500 text-white text-xs px-2 py-1 rounded hover:bg-yellow-600"
                                            >
                                                Edit
                                            </button>
                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(u.id, u.full_name || u.username);
                                                }}
                                                className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="text-sm text-gray-700">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={indexOfLastUser >= filteredUsers.length}
                            className="px-3 py-1 border rounded"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <EditParticipantModal
                    token={token}
                    user={editingUser}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                    }}
                    onSaved={() => {
                        refreshUsers();
                        refreshAssignments();
                    }}
                />
            )}
        </div>
    );
}

export default ParticipantsPage;