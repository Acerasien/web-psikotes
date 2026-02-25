import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ParticipantProfilePage({ token }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true); // good practice

                // Fetch User
                const userRes = await axios.get(`http://127.0.0.1:8000/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(userRes.data);

                // Fetch Assignments
                const assignRes = await axios.get(`http://127.0.0.1:8000/assignments/?user_id=${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAssignments(assignRes.data);

                // Fetch Results
                const resultsRes = await axios.get(`http://127.0.0.1:8000/results/?user_id=${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setResults(resultsRes.data);
            } catch (err) {
                console.error('Error fetching participant data:', err);
                // Optional: show error to user
            } finally {
                setLoading(false); // ← now correctly inside the function
            }
        };

        fetchData();
    }, [id, token]); // ← dependency array is correct

    // Early return while loading
    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    // If user failed to load
    if (!user) {
        return <div className="p-8 text-center text-red-600">User not found</div>;
    }

    return (
        <div className="space-y-6 p-4 max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Profile: {user.full_name || user.username}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {user.position} - {user.department}
                    </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-500">Age:</span> {user.age || '-'}
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">Education:</span> {user.education || '-'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Status Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Test Status</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {assignments.length === 0 ? (
                        <p className="text-gray-500 col-span-full text-center">No tests assigned yet.</p>
                    ) : (
                        assignments.map((a) => (
                            <div key={a.id} className="border rounded-lg p-4 text-center">
                                <h4 className="font-bold text-lg">{a.test_name}</h4>
                                <p
                                    className={`mt-2 text-sm font-bold ${a.status === 'completed'
                                            ? 'text-green-600'
                                            : a.status === 'locked'
                                                ? 'text-red-600'
                                                : 'text-yellow-600'
                                        }`}
                                >
                                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Results Card */}
            {results.length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Test Results</h3>
                    </div>
                    <div className="p-4 divide-y">
                        {results.map((r) => (
                            <div key={r.id} className="py-3 flex justify-between items-center">
                                <span className="font-medium">{r.test_name}</span>
                                <span className="text-green-600 font-bold text-lg">
                                    {r.score} / {r.total_questions}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ParticipantProfilePage;