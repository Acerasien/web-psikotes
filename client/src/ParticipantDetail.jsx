import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from './utils/api';

function ParticipantDetail({ token }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [participant, setParticipant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipant = async () => {
            try {
                const response = await api.getUser(id);
                setParticipant(response.data);
            } catch (error) {
                console.error('Error fetching participant:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipant();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!participant) return <div>Participant not found.</div>;

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