import { useState, useEffect } from 'react';
import axios from 'axios';

function ResultsPage({ token }) {
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const r = await axios.get('http://127.0.0.1:8000/results/', { headers: { Authorization: `Bearer ${token}` } });
                setResults(r.data);
            } catch (e) { console.error(e); }
        };
        fetchResults();
    }, [token]);

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Latest Results</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {results.length === 0 && (
                            <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No results yet.</td></tr>
                        )}
                        {results.map((r) => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.full_name || r.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.test_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{r.score} / {r.total_questions}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(r.time_taken / 60)}m {r.time_taken % 60}s</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultsPage;