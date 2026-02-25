import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ResultsPage({ token }) {
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const r = await axios.get('http://127.0.0.1:8000/results/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Sort by completed_at descending (most recent first)
                const sorted = r.data.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
                setResults(sorted);
            } catch (e) {
                console.error(e);
            }
        };
        fetchResults();
    }, [token]);

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Latest Test Completions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {results.length === 0 && (
                            <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No results yet.</td></tr>
                        )}
                        {results.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/participants/${r.user_id}`} className="text-blue-600 hover:underline">
                                        {r.full_name || r.username}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.test_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                    {r.score} / {r.total_questions}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(r.completed_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultsPage;