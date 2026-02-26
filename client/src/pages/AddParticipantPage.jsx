// client/src/pages/AddParticipantPage.jsx
import { useNavigate } from 'react-router-dom';
import CreateUser from '../CreateUser';

function AddParticipantPage({ token, currentUserRole }) {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/participants');
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:odeled-lg max-w-2xl mx-auto">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Participant</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Fill in the details below to create a new participant account.
                </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
                <CreateUser token={token} onUserCreated={handleSuccess} currentUserRole={currentUserRole} />
                <div className="mt-4 text-right">
                    <button onClick={() => navigate('/participants')} className="text-sm text-gray-500 hover:text-gray-700">
                        &larr; Back to List
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddParticipantPage;