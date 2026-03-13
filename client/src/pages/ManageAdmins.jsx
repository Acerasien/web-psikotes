// client/src/pages/ManageAdmins.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import EditParticipantModal from '../components/EditParticipantModal';

function ManageAdmins() {
    const { token, isSuperadmin: currentUserRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchAdmins = async () => {
        try {
            const res = await api.getUsers();
            // Filter only admin and superadmin
            const admins = res.data.filter(u => u.role === 'admin' || u.role === 'superadmin');
            setUsers(admins);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleResetPassword = async (userId, username) => {
        const result = await Swal.fire({
            title: 'Reset Password?',
            text: `Reset password for ${username}? A new random password will be generated and shown once.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, reset'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.resetPassword(userId);
                const newPassword = res.data.new_password;
                await Swal.fire({
                    title: 'Password Reset',
                    html: `New password for <strong>${username}</strong>:<br><code style="font-size:1.2rem; background:#f0f0f0; padding:4px 8px; border-radius:4px;">${newPassword}</code><br><br>Make sure to copy it now.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } catch (err) {
                Swal.fire('Error', 'Could not reset password.', 'error');
            }
        }
    };

    const handleDelete = async (userId, username) => {
        const result = await Swal.fire({
            title: 'Delete Admin?',
            text: `Are you sure you want to delete ${username}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete'
        });

        if (result.isConfirmed) {
            try {
                await api.deleteUser(userId);
                Swal.fire('Deleted!', 'Admin has been deleted.', 'success');
                fetchAdmins();
            } catch (err) {
                Swal.fire('Error', 'Could not delete admin.', 'error');
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading admins...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Admins</h3>
                    <Link
                        to="/participants/new"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                        + Add Admin
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No admins found.</td></tr>
                            )}
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.full_name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.department || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.position || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingUser(u);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-yellow-600 hover:text-yellow-800 text-lg"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(u.id, u.username)}
                                                className="text-blue-600 hover:text-blue-800 text-lg"
                                                title="Reset Password"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id, u.username)}
                                                className="text-red-600 hover:text-red-800 text-lg"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal (reuse same component) */}
            {showEditModal && (
                <EditParticipantModal
                    user={editingUser}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                    }}
                    onSaved={() => {
                        fetchAdmins();
                    }}
                />
            )}
        </div>
    );
}

export default ManageAdmins;