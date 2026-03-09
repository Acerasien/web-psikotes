import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import EditParticipantModal from '../components/EditParticipantModal';
import BulkUploadModal from '../components/BulkUploadModal';

function ParticipantsPage({ token, currentUserRole }) {
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
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    // Helper functions
    const getUserAssignments = (userId) => assignments.filter(a => a.user_id === userId);
    const isTestAssigned = (userId, testId) => assignments.some(a => a.user_id === userId && a.test_id === testId);

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

    const handleAssignAll = async (userId) => {
        const result = await Swal.fire({
            title: 'Assign All Tests?',
            text: 'This will assign every available test to this participant (except those already assigned). Continue?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, assign all',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await axios.post(`http://127.0.0.1:8000/assignments/assign-all/${userId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Success', 'All tests assigned successfully!', 'success');
                refreshAssignments();   // refresh assignments list
            } catch (err) {
                Swal.fire('Error', 'Could not assign tests.', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Add button and Search */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Participants</h3>
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search by name or department..."
                            className="border rounded px-3 py-2 text-sm w-64 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Link
                            to="/participants/new"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm whitespace-nowrap"
                        >
                            + Add Participant
                        </Link>
                        <button
                            onClick={() => setShowBulkUpload(true)}
                            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm ml-2"
                        >
                            + Bulk Upload
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No participants found.
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map((u) => {
                                    const userAssignments = getUserAssignments(u.id);
                                    const hasLocked = userAssignments.some(a => a.status === 'locked');
                                    const availableTests = tests.filter(t => !isTestAssigned(u.id, t.id));

                                    return (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => navigate(`/participants/${u.id}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{u.full_name || u.username}</div>
                                                <div className="text-sm text-gray-500">{u.username}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.department || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-wrap gap-2">
                                                    {userAssignments.length > 0 ? (
                                                        userAssignments.map(a => {
                                                            let bgColor = 'bg-green-100 text-green-800';
                                                            if (a.status === 'locked') bgColor = 'bg-red-100 text-red-800';
                                                            else if (a.status === 'in_progress') bgColor = 'bg-yellow-100 text-yellow-800';
                                                            return (
                                                                <span
                                                                    key={a.id}
                                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}
                                                                >
                                                                    {a.test_name} ({a.status})
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">No tests assigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Unlock button (if locked) */}
                                                    {currentUserRole === 'superadmin' && hasLocked && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const lockedA = userAssignments.find(a => a.status === 'locked');
                                                                handleUnlock(lockedA.id, e);
                                                            }}
                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
                                                            title="Unlock test"
                                                        >
                                                            Unlock
                                                        </button>
                                                    )}

                                                    {/* Assignment group: dropdown + add button */}
                                                    <div className="flex items-center gap-1 bg-gray-50 rounded p-1">
                                                        <select
                                                            className="border rounded px-2 py-1 text-xs w-28 focus:ring-blue-500 focus:border-blue-500"
                                                            value={selectedTest[u.id] || ''}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTest({ ...selectedTest, [u.id]: e.target.value });
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="" disabled>Assign test</option>
                                                            {availableTests.map(t => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={(e) => handleAssign(u.id, e)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                                                            title="Add selected test"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAssignAll(u.id);
                                                            }}
                                                            className="bg-purple-500 text-white text-xs px-2 py-1 rounded hover:bg-purple-600"
                                                            title="Assign all tests"
                                                        >
                                                            All
                                                        </button>
                                                    </div>

                                                    {/* Edit & Delete icons, only for superadmin */}
                                                    {currentUserRole === 'superadmin' && (
                                                        <>
                                                            {/* Edit icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingUser(u);
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="text-yellow-600 hover:text-yellow-800 text-lg"
                                                                title="Edit participant"
                                                            >
                                                                ✏️
                                                            </button>

                                                            {/* Delete icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(u.id, u.full_name || u.username);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 text-lg"
                                                                title="Delete participant"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="text-sm text-gray-700">
                        Showing {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} to{' '}
                        {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} participants
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={indexOfLastUser >= filteredUsers.length}
                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
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
            {showBulkUpload && (
                <BulkUploadModal
                    token={token}
                    onClose={() => setShowBulkUpload(false)}
                    onSuccess={() => {
                        refreshUsers();
                        // optionally refresh assignments if assign_all was used
                        refreshAssignments();
                    }}
                />
            )}
        </div>
    );
}

export default ParticipantsPage;