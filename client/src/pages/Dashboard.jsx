// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard({ token }) {
    const [summary, setSummary] = useState(null);
    const [testStats, setTestStats] = useState([]);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, testsRes, recentRes] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/admin/stats/summary', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://127.0.0.1:8000/admin/stats/tests', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://127.0.0.1:8000/admin/stats/recent?limit=10', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setSummary(summaryRes.data);
                setTestStats(testsRes.data);
                setRecent(recentRes.data);
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    // If any of the data is missing, show a friendly error
    if (!summary || !testStats || !recent) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
                Failed to load dashboard data. Please try again later.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="text-sm text-gray-500">Total Participants</div>
                    <div className="text-2xl font-bold">{summary.total_participants}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="text-sm text-gray-500">Tests Completed</div>
                    <div className="text-2xl font-bold">{summary.completed_assignments}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                    <div className="text-sm text-gray-500">Completion Rate</div>
                    <div className="text-2xl font-bold">{summary.completion_rate}%</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="text-sm text-gray-500">Avg Score (raw)</div>
                    <div className="text-2xl font-bold">{summary.average_score}</div>
                </div>
            </div>

            {/* Test Popularity Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">📊 Test Popularity</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={testStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="test_name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="completed_count" fill="#3b82f6" name="Completed" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Average Score per Test */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">📈 Average Score by Test</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={testStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="test_name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="avg_score" fill="#22c55e" name="Avg Raw Score" />
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2">
                    *Raw scores, not percentages. Max possible: DISC=24, Speed/Memory/Logic=100, Temperament=168.
                </p>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">🕒 Recent Test Completions</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recent.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm">{item.participant_name}</td>
                                    <td className="px-4 py-2 text-sm">{item.test_name}</td>
                                    <td className="px-4 py-2 text-sm font-medium text-green-600">{item.score} / {item.total_questions}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                        {new Date(item.completed_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;