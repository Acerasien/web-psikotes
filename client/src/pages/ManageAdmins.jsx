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
            title: 'Reset Kata Sandi?',
            text: `Reset kata sandi untuk ${username}? Kata sandi baru akan dibuat dan hanya ditampilkan satu kali.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, reset'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.resetPassword(userId);
                const newPassword = res.data.new_password;
                await Swal.fire({
                    title: 'Kata Sandi Direset',
                    html: `Kata sandi baru untuk <strong>${username}</strong>:<br><code style="font-size:1.2rem; background:#f0f0f0; padding:4px 8px; border-radius:4px;">${newPassword}</code><br><br>Pastikan untuk menyalinnya sekarang.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } catch (err) {
                Swal.fire('Kesalahan', 'Gagal mereset kata sandi.', 'error');
            }
        }
    };

    const handleDelete = async (userId, username) => {
        const result = await Swal.fire({
            title: 'Hapus Admin?',
            text: `Yakin ingin menghapus ${username}? Tindakan ini tidak dapat dibatalkan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus'
        });

        if (result.isConfirmed) {
            try {
                await api.deleteUser(userId);
                Swal.fire('Berhasil dihapus!', 'Admin telah dihapus.', 'success');
                fetchAdmins();
            } catch (err) {
                Swal.fire('Kesalahan', 'Gagal menghapus admin.', 'error');
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat data admin...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Kelola Admin</h3>
                    <Link
                        to="/admins/new"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm text-center min-h-[44px] inline-flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        + Tambah Admin
                    </Link>
                </div>

                {/* Mobile Card View - shows on screens < lg */}
                <div className="lg:hidden divide-y divide-gray-200">
                    {users.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p>Tidak ada admin ditemukan</p>
                        </div>
                    ) : (
                        users.map(u => (
                            <div key={u.id} className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate" title={u.username}>{u.username}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate" title={u.full_name || '-'}>{u.full_name || '-'}</p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {u.role}
                                    </span>
                                </div>

                                {/* Info row */}
                                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
                                    {u.department && (
                                        <p><span className="font-medium text-gray-600">Departemen:</span> {u.department}</p>
                                    )}
                                    {u.position && (
                                        <p><span className="font-medium text-gray-600">Jabatan:</span> {u.position}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setEditingUser(u);
                                            setShowEditModal(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-yellow-700 hover:bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-sm min-h-[44px]"
                                    >
                                        <span>✏️</span> Edit
                                    </button>
                                    <button
                                        onClick={() => handleResetPassword(u.id, u.username)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm min-h-[44px]"
                                    >
                                        <span>🔑</span> Reset
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.id, u.username)}
                                        className="flex items-center justify-center text-red-600 hover:bg-red-50 border border-red-200 rounded p-2 min-h-[44px] min-w-[44px]"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peran</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada admin ditemukan.</td></tr>
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
