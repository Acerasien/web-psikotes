// client/src/pages/AddAdminPage.jsx
import { useNavigate } from 'react-router-dom';
import CreateUser from '../CreateUser';

function AddAdminPage() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/admins');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 font-display">
                                Tambah Admin Baru
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Daftarkan pengelola sistem baru di platform
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admins')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Daftar
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Container */}
            <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                    <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-primary-800">
                                <p className="font-semibold mb-1">Panduan Pengisian:</p>
                                <ul className="list-disc list-inside space-y-1 text-primary-700">
                                    <li>Pastikan username belum pernah digunakan sebelumnya</li>
                                    <li>Role otomatis diset menjadi <strong>Admin</strong></li>
                                    <li>Gunakan kata sandi yang kuat (minimal 6 karakter)</li>
                                    <li>Lengkapi data organisasi untuk mempermudah manajemen</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <CreateUser onUserCreated={handleSuccess} initialRole="admin" />
                </div>
            </div>
        </div>
    );
}

export default AddAdminPage;
