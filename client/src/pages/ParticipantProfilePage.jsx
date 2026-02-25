import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ParticipantProfilePage({ token }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch user details
                const userRes = await axios.get(`http://127.0.0.1:8000/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                // Fetch assignments for this user
                const assignRes = await axios.get(`http://127.0.0.1:8000/assignments/?user_id=${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAssignments(assignRes.data);

                // Fetch results for this user
                const resultsRes = await axios.get(`http://127.0.0.1:8000/results/?user_id=${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResults(resultsRes.data);

            } catch (err) {
                console.error('Error fetching participant data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token]);

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-red-600">User not found</div>;
    }

    // Helper to get the result for a specific test
    const getResultForTest = (testId) => {
        return results.find(r => r.test_id === testId);
    };

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
                            <span className="font-medium text-gray-500">Username:</span> {user.username}
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">Age:</span> {user.age || '-'}
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">Education:</span> {user.education || '-'}
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">Role:</span> {user.role}
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Status Cards */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Tests</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {assignments.length === 0 ? (
                        <p className="text-gray-500 col-span-full text-center">No tests assigned yet.</p>
                    ) : (
                        assignments.map((a) => {
                            const result = getResultForTest(a.test_id);
                            return (
                                <div key={a.id} className="border rounded-lg p-4">
                                    <h4 className="font-bold text-lg">{a.test_name}</h4>
                                    <p className={`mt-2 text-sm font-bold ${a.status === 'completed' ? 'text-green-600' :
                                        a.status === 'locked' ? 'text-red-600' :
                                            a.status === 'in_progress' ? 'text-yellow-600' :
                                                'text-gray-600'
                                        }`}>
                                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                    </p>
                                    {result && (
                                        <p className="text-sm text-gray-700 mt-1">
                                            Score: {result.score} / {result.total_questions}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Detailed Results */}
            {results.length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Test Results</h3>
                    </div>
                    <div className="p-4 divide-y">
                        {results.map((r) => (
                            <div key={r.id} className="py-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-lg">{r.test_name}</span>
                                    <span className="text-green-600 font-bold text-xl">
                                        {r.score} / {r.total_questions}
                                    </span>
                                </div>

                                {/* DISC Specific Details */}
                                {r.test_name === "DISC Assessment" && r.details && (
                                    <div className="mt-2 bg-gray-50 p-3 rounded">
                                        <h4 className="font-semibold mb-2">DISC Profile</h4>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            {['D', 'I', 'S', 'C'].map(trait => (
                                                <div key={trait}>
                                                    <div className="text-sm font-bold text-gray-600">{trait}</div>
                                                    <div className="text-lg">
                                                        {Math.round(r.details.percentages?.[trait] || 0)}%
                                                    </div>
                                                    <div className={`text-xs px-2 py-1 rounded ${r.details.intensity_zones?.[trait] === 'High' ? 'bg-green-100 text-green-800' :
                                                        r.details.intensity_zones?.[trait] === 'Low' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {r.details.intensity_zones?.[trait] || 'Medium'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {r.details.stress_gap !== undefined && (
                                            <div className="mt-3 text-sm">
                                                <span className="font-medium">Stress Gap: </span>
                                                <span className={r.details.stress_gap > 10 ? 'text-red-600 font-bold' : 'text-green-600'}>
                                                    {Math.round(r.details.stress_gap)}
                                                </span>
                                                <span className="text-gray-500 ml-2">
                                                    {r.details.stress_gap > 10 ? '(Significant masking)' : '(Normal range)'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Speed Test Specific Details */}
                                {r.test_name === "Speed Test" && r.details && (
                                    <div className="mt-2 bg-gray-50 p-3 rounded">
                                        <h4 className="font-semibold mb-2">Speed Test Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="font-medium">Score:</span> {r.details.score}
                                            </div>
                                            <div>
                                                <span className="font-medium">Accuracy:</span> {r.details.accuracy}%
                                            </div>
                                            <div>
                                                <span className="font-medium">Questions Answered:</span> {r.details.total_answered}
                                            </div>
                                            <div>
                                                <span className="font-medium">Performance:</span>
                                                <span className={`ml-1 px-2 py-0.5 rounded ${r.details.band?.includes('Excellent') ? 'bg-green-100 text-green-800' :
                                                    r.details.band?.includes('Good') ? 'bg-blue-100 text-blue-800' :
                                                        r.details.band?.includes('Average') ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {r.details.band}
                                                </span>
                                            </div>
                                        </div>
                                        {r.details.flag && (
                                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                                ⚠️ {r.details.flag}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* You can add similar sections for other test types */}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ParticipantProfilePage;