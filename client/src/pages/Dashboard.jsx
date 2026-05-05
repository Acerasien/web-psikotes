// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import PageWrapper from '../components/PageWrapper';

function Dashboard() {
    const { token, user, canSeeResults } = useAuth();
    const [summary, setSummary] = useState(null);
    const [completionStats, setCompletionStats] = useState(null);
    const [securityEvents, setSecurityEvents] = useState([]);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Check if user is superadmin
    const isSuperadmin = user?.role === 'superadmin';

    const fetchData = async () => {
        try {
            setError(null);
            
            // Core stats and security events available to all admin roles
            const [summaryRes, completionRes, securityRes] = await Promise.all([
                api.getStatsSummary(),
                api.getCompletionStats(),
                api.getSecurityEvents(10)
            ]);

            setSummary(summaryRes.data);
            setCompletionStats(completionRes.data);
            setSecurityEvents(securityRes?.data || []);

            // Clinical data restricted to Assessor/Superadmin
            if (canSeeResults) {
                try {
                    const recentRes = await api.getStatsRecent(10);
                    setRecent(recentRes?.data || []);
                } catch (roleErr) {
                    console.warn('Failed to load clinical recent results', roleErr);
                    setRecent([]);
                }
            } else {
                setRecent([]);
            }

            // Check core data
            if (!summaryRes?.data || !completionRes?.data) {
                throw new Error('Data dasbor tidak lengkap dari server');
            }
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
            setError(err.message || 'Gagal memuat data dasbor');
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
        { name: 'Selesai', value: completionStats.completed, color: '#22c55e' },
        { name: 'Sedang Berjalan', value: completionStats.in_progress, color: '#eab308' },
        { name: 'Menunggu', value: completionStats.pending, color: '#3b82f6' },
        { name: 'Terkunci', value: completionStats.locked, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return (
        <PageWrapper
            loading={loading}
            error={error}
            onRetry={fetchData}
            loadingText="Memuat dasbor..."
            errorTitle="Gagal memuat dasbor"
            errorMessage="Tidak dapat memuat statistik dasbor. Silakan coba lagi."
        >
            <div className="space-y-6">
                {/* System Status Header */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 leading-tight">Status Sistem</h2>
                            <p className="text-sm text-neutral-500 font-medium">Semua sistem operasional dan berjalan normal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pr-2">
                        <div className="flex items-center gap-3 bg-success-light/30 px-4 py-2 rounded-full border border-success/10">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                            </span>
                            <span className="text-sm font-bold text-success-dark">
                                {completionStats.in_progress} Peserta Aktif
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-neutral-400">
                            <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
                            <span className="text-xs font-medium uppercase tracking-wider">Live Monitoring</span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 border-l-[6px] border-l-primary-500">
                        <div className="text-sm text-neutral-500 font-medium mb-1">Total Peserta</div>
                        <div className="text-3xl font-bold font-display text-neutral-900">{summary.total_participants}</div>
                    </div>
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 border-l-[6px] border-l-success">
                        <div className="text-sm text-neutral-500 font-medium mb-1">Tes Selesai</div>
                        <div className="text-3xl font-bold font-display text-neutral-900">{summary.completed_assignments}</div>
                    </div>
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 border-l-[6px] border-l-warning">
                        <div className="text-sm text-neutral-500 font-medium mb-1">Tingkat Penyelesaian</div>
                        <div className="text-3xl font-bold font-display text-neutral-900">{summary.completion_rate}%</div>
                    </div>
                </div>

                {/* Completion Status & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Completion Status Pie Chart */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200">
                        <h3 className="text-xl font-bold font-display text-neutral-900 mb-6">📊 Status Penugasan</h3>
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
                        <div className="mt-8 grid grid-cols-2 gap-4 text-sm font-medium text-neutral-600">
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-success"></div>
                                <span>Selesai: {completionStats.completed}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-warning"></div>
                                <span>Sedang Berjalan: {completionStats.in_progress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-primary-500"></div>
                                <span>Menunggu: {completionStats.pending}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-error"></div>
                                <span>Terkunci: {completionStats.locked}</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerts - Incomplete & Security */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200">
                        <h3 className="text-xl font-bold font-display text-neutral-900 mb-6">⚠️ Perlu Perhatian</h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {/* Incomplete submissions */}
                            {completionStats.incomplete_submissions > 0 && (
                                <div className="flex items-start gap-3 p-4 bg-warning-light rounded-xl border border-warning/20">
                                    <svg className="w-6 h-6 text-warning-dark flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <p className="font-semibold text-warning-dark">Pengiriman Tidak Lengkap</p>
                                        <p className="text-sm text-warning-dark/80 font-medium">{completionStats.incomplete_submissions} tes dikirim dengan soal yang belum dijawab</p>
                                    </div>
                                </div>
                            )}

                            {/* Security events */}
                            {securityEvents.slice(0, 4).map((event, idx) => (
                                <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border ${
                                    event.severity === 'critical' 
                                        ? 'bg-error-light border-error/20 text-error-dark' 
                                        : 'bg-warning-light border-warning/20 text-warning-dark'
                                }`}>
                                    <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {event.type === 'locked' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        )}
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[15px] truncate">{event.full_name || event.username}</p>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 truncate">{event.test_name}</p>
                                        <p className="text-sm opacity-90 mt-1">{event.reason}</p>
                                    </div>
                                </div>
                            ))}

                            {completionStats.incomplete_submissions === 0 && securityEvents.length === 0 && (
                                <div className="text-center py-10 text-neutral-400">
                                    <svg className="w-14 h-14 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="font-medium">Semua tes berhasil diselesaikan!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity - Assessors & Superadmins */}
                {canSeeResults && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 mt-6">
                        <h3 className="text-xl font-bold font-display text-neutral-900 mb-6">🕒 Penyelesaian Tes Terbaru</h3>
                        <div className="overflow-x-auto rounded-xl border border-neutral-200">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Peserta</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Tes</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Skor</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Selesai</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-200">
                                    {recent.map(item => (
                                        <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-800 max-w-[200px] truncate" title={item.participant_name}>
                                                {item.participant_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 max-w-[150px] truncate" title={item.test_name}>
                                                {item.test_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-success-dark">
                                                {item.score} <span className="text-neutral-400 font-medium">/ {item.total_questions}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(item.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}

export default Dashboard;
