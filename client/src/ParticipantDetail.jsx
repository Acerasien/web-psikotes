import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { api } from './utils/api';

function ParticipantDetail({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [participant, setParticipant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchParticipant = async () => {
            try {
                // Check if user has permission
                if (user?.role !== 'superadmin') {
                    setError('access_denied');
                    setLoading(false);
                    return;
                }
                
                const response = await api.getUser(id);
                setParticipant(response.data);
            } catch (err) {
                console.error('Error fetching participant:', err);
                
                // Check if it's a permission error (403)
                if (err.response?.status === 403) {
                    setError('access_denied');
                } else if (err.response?.status === 404) {
                    setError('not_found');
                } else {
                    setError('error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchParticipant();
    }, [id, user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (error === 'access_denied') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to view participant details. Only superadmins can access this page.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    
    if (error === 'not_found') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="text-6xl mb-4">❓</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Participant Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        The participant you're looking for doesn't exist or has been removed.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Something Went Wrong</h2>
                    <p className="text-gray-600 mb-6">
                        Unable to load participant details. Please try again.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    
    if (!participant) return null;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {participant.full_name || participant.username}'s Profile
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {participant.position} - {participant.department}
                </p>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{participant.full_name || '-'}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Age</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{participant.age || '-'}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Education</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{participant.education || '-'}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Department</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{participant.department || '-'}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Position</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{participant.position || '-'}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

export default ParticipantDetail;