// client/src/pages/AddParticipantPage.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreateUser from '../CreateUser';

function AddParticipantPage() {
    const navigate = useNavigate();
    const { token, isSuperadmin: currentUserRole } = useAuth();

    const handleSuccess = () => {
        navigate('/participants');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {currentUserRole === 'superadmin' ? 'Add New User' : 'Add New Participant'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Create a new {currentUserRole === 'superadmin' ? 'user account' : 'participant'} in the system
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/participants')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to List
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Container - Centered */}
            <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                    {/* Help Text - Top */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Tips:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Username must be unique and at least 3 characters long</li>
                                    <li>Password should be at least 6 characters for security</li>
                                    <li>Full name will be displayed in reports and certificates</li>
                                    <li>Department and position help organize participants</li>
                                    {currentUserRole === 'superadmin' && (
                                        <li>Use the Role field to grant admin access if needed</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <CreateUser onUserCreated={handleSuccess} />
                </div>
            </div>
        </div>
    );
}

export default AddParticipantPage;