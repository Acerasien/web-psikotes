import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import EditParticipantModal from '../components/EditParticipantModal';
import BulkUploadModal from '../components/BulkUploadModal';

// Sort icons
const SortIcon = ({ direction }) => {
    if (!direction) return <span className="ml-1 text-gray-300">↕</span>;
    return (
        <span className="ml-1 text-blue-500">
            {direction === 'asc' ? '↑' : '↓'}
        </span>
    );
};

function ParticipantsPage() {
    const { token, isSuperadmin } = useAuth();
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
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
    
    // Batch selection state
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);

    // Helper functions
    const getUserAssignments = (userId) => assignments.filter(a => a.user_id === userId);
    const isTestAssigned = (userId, testId) => assignments.some(a => a.user_id === userId && a.test_id === testId);

    const fetchTests = async () => {
        try {
            const r = await api.getTests();
            setTests(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    const refreshAssignments = async () => {
        try {
            const r = await api.getAssignments();
            setAssignments(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    const refreshUsers = async () => {
        try {
            const r = await api.getUsers();
            setUsersList(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        refreshUsers();
        fetchTests();
        refreshAssignments();
    }, []);

    // Filtering
    const filteredUsers = usersList
        .filter(u => u.role === 'participant')
        .filter(u => {
            if (!searchTerm) return true;
            const name = (u.full_name || u.username).toLowerCase();
            const dept = (u.department || "").toLowerCase();
            return name.includes(searchTerm.toLowerCase()) || dept.includes(searchTerm.toLowerCase());
        });

    // Sorting
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const { key, direction } = sortConfig;
        
        let aValue, bValue;
        if (key === 'full_name') {
            aValue = (a.full_name || a.username || '').toLowerCase();
            bValue = (b.full_name || b.username || '').toLowerCase();
        } else if (key === 'department') {
            aValue = (a.department || '').toLowerCase();
            bValue = (b.department || '').toLowerCase();
        } else if (key === 'tests_count') {
            aValue = getUserAssignments(a.id).length;
            bValue = getUserAssignments(b.id).length;
        } else if (key === 'status') {
            const aAssignments = getUserAssignments(a.id);
            const bAssignments = getUserAssignments(b.id);
            const aHasLocked = aAssignments.some(as => as.status === 'locked');
            const bHasLocked = bAssignments.some(bs => bs.status === 'locked');
            const aHasInProgress = aAssignments.some(as => as.status === 'in_progress');
            const bHasInProgress = bAssignments.some(bs => bs.status === 'in_progress');
            // Priority: locked > in_progress > completed > pending
            const getStatusPriority = (hasLocked, hasInProgress, assignments) => {
                if (hasLocked) return 1;
                if (hasInProgress) return 2;
                if (assignments.length === 0) return 4;
                return 3; // completed
            };
            aValue = getStatusPriority(aHasLocked, aHasInProgress, aAssignments);
            bValue = getStatusPriority(bHasLocked, bHasInProgress, bAssignments);
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const indexOfLastUser = currentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortDirection = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction;
    };

    const handleAssign = async (userId, e) => {
        e.stopPropagation();
        const testId = selectedTest[userId];
        if (!testId) {
            Swal.fire("Error", "Select a test first", "error");
            return;
        }
        try {
            await api.createAssignment(userId, testId);
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
                await api.unlockAssignment(assignmentId);
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
                await api.deleteUser(userId);
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
                await api.assignAllTests(userId);
                Swal.fire('Success', 'All tests assigned successfully!', 'success');
                refreshAssignments();   // refresh assignments list
            } catch (err) {
                Swal.fire('Error', 'Could not assign tests.', 'error');
            }
        }
    };

    // Batch selection handlers
    const toggleSelectUser = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.size === currentUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(currentUsers.map(u => u.id)));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedUsers.size === 0) return;

        const result = await Swal.fire({
            title: 'Delete Selected Participants?',
            html: `Are you sure you want to delete <strong>${selectedUsers.size}</strong> participant${selectedUsers.size !== 1 ? 's' : ''}?<br/><br/>
                   <span class="text-red-600 text-sm">This will permanently remove all their data including test results and assignments.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete all',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const deletePromises = Array.from(selectedUsers).map(userId => api.deleteUser(userId));
                await Promise.all(deletePromises);
                
                Swal.fire(
                    'Deleted!',
                    `${selectedUsers.size} participant${selectedUsers.size !== 1 ? 's have' : ' has'} been deleted.`,
                    'success'
                );
                setSelectedUsers(new Set());
                setIsSelectMode(false);
                refreshUsers();
                refreshAssignments();
            } catch (err) {
                Swal.fire('Error', 'Could not delete participants.', 'error');
            }
        }
    };

    const clearSelection = () => {
        setSelectedUsers(new Set());
        setIsSelectMode(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Page Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <span className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </span>
                                Manage Participants
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {filteredUsers.length} participant{filteredUsers.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search participants..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSelectMode(!isSelectMode);
                                    if (isSelectMode) setSelectedUsers(new Set());
                                }}
                                className={`inline-flex items-center gap-2 font-medium py-2 px-4 rounded-lg transition-colors shadow-sm border-2 ${
                                    isSelectMode || selectedUsers.size > 0
                                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                title="Enable batch selection mode"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                {isSelectMode || selectedUsers.size > 0 ? 'Selecting...' : 'Select'}
                            </button>
                            <Link
                                to="/participants/new"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Participant
                            </Link>
                            <button
                                onClick={() => setShowBulkUpload(true)}
                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Bulk Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Batch Action Bar */}
                {selectedUsers.size > 0 && (
                    <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-3 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.size === currentUsers.length && currentUsers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    <span className="font-bold text-blue-700">{selectedUsers.size}</span> participant{selectedUsers.size !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearSelection}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}

                {/* Sort Indicator Bar */}
                {sortConfig.key && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            <span className="text-gray-600">Sorting by:</span>
                            <span className="font-semibold text-blue-700 capitalize">
                                {sortConfig.key.replace('_', ' ')}
                            </span>
                            <span className="text-blue-500">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                        </div>
                        <button
                            onClick={() => setSortConfig({ key: 'full_name', direction: 'asc' })}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            Reset to default
                        </button>
                    </div>
                )}

                {/* Mobile Card View - shows on screens < lg */}
                <div className="lg:hidden space-y-4">
                    {currentUsers.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">No participants found</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new participant</p>
                        </div>
                    ) : (
                        currentUsers.map((u) => {
                            const userAssignments = getUserAssignments(u.id);
                            const hasLocked = userAssignments.some(a => a.status === 'locked');
                            const hasInProgress = userAssignments.some(a => a.status === 'in_progress');
                            const availableTests = tests.filter(t => !isTestAssigned(u.id, t.id));

                            let statusColor = 'border-green-500';
                            if (hasLocked) statusColor = 'border-red-500';
                            else if (hasInProgress) statusColor = 'border-yellow-500';

                            return (
                                <div
                                    key={u.id}
                                    className={`bg-white rounded-xl shadow-sm border-l-4 ${statusColor} p-4 space-y-3`}
                                >
                                    {/* Header with checkbox and avatar */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1" onClick={() => navigate(`/participants/${u.id}`)}>
                                            {isSelectMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(u.id)}
                                                    onChange={() => toggleSelectUser(u.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                />
                                            )}
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {(u.full_name || u.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{u.full_name || u.username}</h3>
                                                <p className="text-sm text-gray-500 truncate">@{u.username} • {u.department || 'N/A'}</p>
                                            </div>
                                        </div>
                                        {isSuperadmin && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingUser(u);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(u.id, u.full_name || u.username);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tests badges */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {userAssignments.length > 0 ? (
                                            userAssignments.slice(0, 5).map(a => {
                                                let bgColor = 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20';
                                                if (a.status === 'locked') bgColor = 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20';
                                                else if (a.status === 'in_progress') bgColor = 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
                                                return (
                                                    <span
                                                        key={a.id}
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${bgColor}`}
                                                        title={a.test_name}
                                                    >
                                                        {a.test_name}
                                                        {a.status === 'locked' && isSuperadmin && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUnlock(a.id, e);
                                                                }}
                                                                className="ml-1 hover:text-red-900"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-sm text-gray-400 italic">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                No tests assigned
                                            </span>
                                        )}
                                        {userAssignments.length > 5 && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                                                +{userAssignments.length - 5} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                                        {availableTests.length > 0 && (
                                            <div className="flex-1 flex gap-1">
                                                <select
                                                    className="flex-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 py-2 px-3 focus:ring-2 focus:ring-blue-500 bg-white"
                                                    value={selectedTest[u.id] || ''}
                                                    onChange={(e) => setSelectedTest({ ...selectedTest, [u.id]: e.target.value })}
                                                >
                                                    <option value="" disabled>Assign...</option>
                                                    {availableTests.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleAssign(u.id, { stopPropagation: () => {} })}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleAssignAll(u.id)}
                                            className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                                        >
                                            All Tests
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table View - hidden on mobile */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className={`px-6 py-4 text-left ${!isSelectMode && selectedUsers.size === 0 ? 'hidden' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.size === currentUsers.length && currentUsers.length > 0}
                                            onChange={toggleSelectAll}
                                            disabled={currentUsers.length === 0}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Select all on this page"
                                        />
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none group"
                                        onClick={() => handleSort('full_name')}
                                        title="Click to sort by name"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>Name</span>
                                            <SortIcon direction={getSortDirection('full_name')} />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none group"
                                        onClick={() => handleSort('department')}
                                        title="Click to sort by department"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>Department</span>
                                            <SortIcon direction={getSortDirection('department')} />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none group"
                                        onClick={() => handleSort('tests_count')}
                                        title="Click to sort by number of tests"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                            <span>Tests Assigned</span>
                                            <SortIcon direction={getSortDirection('tests_count')} />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none group"
                                        onClick={() => handleSort('status')}
                                        title="Click to sort by status (locked first)"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Actions</span>
                                            <SortIcon direction={getSortDirection('status')} />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p className="text-gray-500 text-lg font-medium">No participants found</p>
                                                <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new participant</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((u) => {
                                        const userAssignments = getUserAssignments(u.id);
                                        const hasLocked = userAssignments.some(a => a.status === 'locked');
                                        const hasInProgress = userAssignments.some(a => a.status === 'in_progress');
                                        const availableTests = tests.filter(t => !isTestAssigned(u.id, t.id));
                                        
                                        // Determine row status color
                                        let rowBorderColor = 'border-l-transparent';
                                        if (hasLocked) rowBorderColor = 'border-l-red-500';
                                        else if (hasInProgress) rowBorderColor = 'border-l-yellow-500';
                                        else if (userAssignments.length > 0) rowBorderColor = 'border-l-green-500';

                                        return (
                                            <tr
                                                key={u.id}
                                                className={`hover:bg-blue-50 cursor-pointer transition-colors border-l-4 ${rowBorderColor}`}
                                                onClick={() => navigate(`/participants/${u.id}`)}
                                            >
                                                <td className={`px-6 py-4 ${!isSelectMode && selectedUsers.size === 0 ? 'hidden' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.has(u.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            toggleSelectUser(u.id);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                            {(u.full_name || u.username).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4 min-w-0 flex-1">
                                                            <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]" title={u.full_name || u.username}>
                                                                {u.full_name || u.username}
                                                            </div>
                                                            <div className="text-sm text-gray-500 truncate max-w-[200px]" title={`@${u.username}`}>
                                                                @{u.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span className="text-sm text-gray-700">{u.department || <span className="text-gray-400 italic">Not assigned</span>}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {userAssignments.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {userAssignments.slice(0, 3).map(a => {
                                                                let bgColor = 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20';
                                                                if (a.status === 'locked') bgColor = 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20';
                                                                else if (a.status === 'in_progress') bgColor = 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
                                                                return (
                                                                    <span
                                                                        key={a.id}
                                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${bgColor}`}
                                                                        title={a.test_name}
                                                                    >
                                                                        {a.test_name}
                                                                    </span>
                                                                );
                                                            })}
                                                            {userAssignments.length > 3 && (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20 whitespace-nowrap">
                                                                    +{userAssignments.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-sm text-gray-400 italic">
                                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                            No tests assigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                        {/* Unlock button (if locked) */}
                                                        {isSuperadmin && hasLocked && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const lockedA = userAssignments.find(a => a.status === 'locked');
                                                                    handleUnlock(lockedA.id, e);
                                                                }}
                                                                className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                                                title="Unlock test"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                                </svg>
                                                                Unlock
                                                            </button>
                                                        )}

                                                        {/* Assignment group */}
                                                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1 ring-1 ring-gray-200">
                                                            <select
                                                                className="border-0 bg-transparent text-xs font-medium text-gray-700 py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-blue-500 rounded cursor-pointer"
                                                                value={selectedTest[u.id] || ''}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedTest({ ...selectedTest, [u.id]: e.target.value });
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <option value="" disabled>Assign...</option>
                                                                {availableTests.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={(e) => handleAssign(u.id, e)}
                                                                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                                                title="Add selected test"
                                                            >
                                                                Add
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAssignAll(u.id);
                                                                }}
                                                                className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                                                title="Assign all tests"
                                                            >
                                                                All
                                                            </button>
                                                        </div>

                                                        {/* Edit & Delete icons, only for superadmin */}
                                                        {isSuperadmin && (
                                                            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingUser(u);
                                                                        setShowEditModal(true);
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                                    title="Edit participant"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(u.id, u.full_name || u.username);
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete participant"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
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
                </div>

                {/* Pagination */}
                <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-semibold text-gray-900">{filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0}</span> to{' '}
                            <span className="font-semibold text-gray-900">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of{' '}
                            <span className="font-semibold text-gray-900">{filteredUsers.length}</span>{' '}
                            <span className="hidden sm:inline">participants</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="hidden sm:inline">Previous</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={indexOfLastUser >= filteredUsers.length}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <EditParticipantModal
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