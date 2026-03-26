// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import PageWrapper from '../components/PageWrapper';

function Dashboard() {
    const { token } = useAuth();
    const [summary, setSummary] = useState(null);
    const [completionStats, setCompletionStats] = useState(null);
    const [securityEvents, setSecurityEvents] = useState([]);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setError(null);
            const [summaryRes, completionRes, securityRes, recentRes] = await Promise.all([
                api.getStatsSummary(),
                api.getCompletionStats(),
                api.getSecurityEvents(10),
                api.getStatsRecent(10)
            ]);

            const summaryData = summaryRes?.data || null;
            const completionData = completionRes?.data || null;
            const securityData = securityRes?.data || [];
            const recentData = recentRes?.data || null;

            setSummary(summaryData);
            setCompletionStats(completionData);
            setSecurityEvents(securityData);
            setRecent(recentData);

            // Check if any data is missing
            if (!summaryData || !completionData || !recentData) {
                throw new Error('Incomplete data received from server');
            }
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
            setError(err.message || 'Failed to load dashboard data');
            setSummary(null);
            setCompletionStats(null);
            setSecurityEvents([]);
            setRecent([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    // Don't render if still loading or if there's an error (handled by PageWrapper)
    if (!summary || !completionStats || !recent) {
        return null;
    }

    // Pie chart data for completion status
    const completionData = [
        { name: 'Completed', value: completionStats.completed, color: '#22c55e' },
        { name: 'In Progress', value: completionStats.in_progress, color: '#eab308' },
        { name: 'Pending', value: completionStats.pending, color: '#3b82f6' },
        { name: 'Locked', value: completionStats.locked, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return (
        <PageWrapper
            loading={loading}
            error={error}
            onRetry={fetchData}
            loadingText="Loading dashboard..."
            errorTitle="Failed to load dashboard"
            errorMessage="Unable to load dashboard statistics. Please try again."
        >
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

                {/* Completion Status & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Completion Status Pie Chart */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">📊 Assignment Status</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={completionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {completionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>Completed: {completionStats.completed}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span>In Progress: {completionStats.in_progress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span>Pending: {completionStats.pending}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>Locked: {completionStats.locked}</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerts - Incomplete & Security */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">⚠️ Needs Attention</h3>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto">
                            {/* Incomplete submissions */}
                            {completionStats.incomplete_submissions > 0 && (
                                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-orange-800">Incomplete Submissions</p>
                                        <p className="text-sm text-orange-700">{completionStats.incomplete_submissions} test(s) submitted with unanswered questions</p>
                                    </div>
                                </div>
                            )}

                            {/* Security events */}
                            {securityEvents.slice(0, 4).map((event, idx) => (
                                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                                    event.severity === 'critical' 
                                        ? 'bg-red-50 border-red-200' 
                                        : 'bg-yellow-50 border-yellow-200'
                                }`}>
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {event.type === 'locked' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        )}
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{event.full_name || event.username}</p>
                                        <p className="text-xs text-gray-600 truncate">{event.test_name}</p>
                                        <p className="text-xs text-gray-500">{event.reason}</p>
                                    </div>
                                </div>
                            ))}

                            {completionStats.incomplete_submissions === 0 && securityEvents.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>All tests completed successfully!</p>
                                </div>
                            )}
                        </div>
                    </div>
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
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm max-w-[200px] truncate" title={item.participant_name}>
                                            {item.participant_name}
                                        </td>
                                        <td className="px-4 py-2 text-sm max-w-[150px] truncate" title={item.test_name}>
                                            {item.test_name}
                                        </td>
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
        </PageWrapper>
    );
}

export default Dashboard;