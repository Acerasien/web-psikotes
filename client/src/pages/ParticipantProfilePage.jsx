import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

/**
 * Compute primary_trait from result details for old results
 * that were scored before the primary_trait field was added to backend.
 */
function computePrimaryTrait(details) {
    if (!details) return null;
    if (details.primary_trait) return details.primary_trait; // already computed by backend

    const percentages = details.percentages;
    if (!percentages) return null;

    const entries = Object.entries(percentages);
    if (entries.length === 0) return null;

    const maxPct = Math.max(...entries.map(([, v]) => v));
    const topNorms = entries.filter(([, v]) => v === maxPct).map(([k]) => k);

    if (topNorms.length === 1) {
        return topNorms[0];
    }
    return topNorms.join(' & ');
}

function ParticipantProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, isSuperadmin } = useAuth();
    const [user, setUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [pdfExporting, setPdfExporting] = useState(false);

    // PDF export handler
    const handleExportPDF = async () => {
        setPdfExporting(true);
        try {
            const response = await api.exportParticipantPdf(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user?.username || 'participant'}_report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            Swal.fire('Kesalahan', 'Gagal mengekspor PDF.', 'error');
        } finally {
            setPdfExporting(false);
        }
    };

    // Export handler
    const handleExportParticipant = async () => {
        setExporting(true);
        try {
            const response = await api.exportParticipant(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user?.username || 'participant'}_results.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            Swal.fire('Kesalahan', 'Gagal mengekspor hasil.', 'error');
        } finally {
            setExporting(false);
        }
    };

    // Define loadParticipantData FIRST using useCallback
    const loadParticipantData = useCallback(async () => {
        try {
            setLoading(true);
            const userRes = await api.getUser(id);
            setUser(userRes.data);

            const assignRes = await api.getAssignments(id);
            setAssignments(assignRes.data);

            const resultsRes = await api.getResults({ user_id: id });
            setResults(resultsRes.data);
        } catch (err) {
            console.error('Error loading participant data:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Load data on mount and when id/token changes
    useEffect(() => {
        loadParticipantData();
    }, [loadParticipantData]);

    const getResultForTest = (testId) => {
        // Get all results for this test and return the latest one
        const testResults = results.filter(r => r.test_id === testId);
        if (testResults.length === 0) return null;
        // Sort by completed_at descending and return the latest
        testResults.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        return testResults[0];
    };

    // Deduplicate results - keep only the latest per test
    const getLatestResults = () => {
        const latestResults = {};
        results.forEach(r => {
            if (!latestResults[r.test_id] || 
                new Date(r.completed_at) > new Date(latestResults[r.test_id].completed_at)) {
                latestResults[r.test_id] = r;
            }
        });
        return Object.values(latestResults);
    };

    // Define handleReset AFTER loadParticipantData
    const handleReset = async (assignmentId, testName) => {
        const result = await Swal.fire({
            title: 'Reset Tes?',
            text: `Yakin ingin mereset "${testName}"? Semua jawaban dan hasil akan dihapus, dan peserta dapat mengerjakan ulang.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, reset'
        });

        if (result.isConfirmed) {
            try {
                await api.resetAssignment(assignmentId);
                Swal.fire('Berhasil direset!', 'Tes telah direset.', 'success');
                loadParticipantData(); // refresh data
            } catch (err) {
                console.error('Reset error:', err);
                Swal.fire('Kesalahan', 'Gagal mereset tes.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg max-w-xl mx-auto my-8">
                Peserta tidak ditemukan
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto font-sans">
            {/* Page Header with Back and Actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors min-h-[44px] flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="hidden sm:inline">Kembali</span>
                            </button>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Profil Peserta</h1>
                        </div>
                        {/* Show export buttons only if the logged-in user is superadmin */}
                        {isSuperadmin && (
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={handleExportParticipant}
                                    disabled={exporting}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="hidden sm:inline">{exporting ? 'Mengekspor...' : 'Ekspor CSV'}</span>
                                    <span className="sm:hidden">CSV</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={pdfExporting}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="hidden sm:inline">{pdfExporting ? 'Membuat...' : 'Ekspor PDF'}</span>
                                    <span className="sm:hidden">PDF</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-blue-100">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span>{user.full_name || user.username}</span>
                        <span className="text-sm text-gray-500">({user.role})</span>
                    </h3>
                    <p className="mt-1 text-gray-600">{user.position} • {user.department}</p>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div>
                        <span className="font-medium text-gray-500">Username</span>
                        <p className="text-gray-800 font-mono">{user.username}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Jenis Kelamin:</span> {user.gender || '-'}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Usia</span>
                        <p className="text-gray-800">{user.age || '–'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Pendidikan</span>
                        <p className="text-gray-800">{user.education || '–'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Peran</span>
                        <p className="text-gray-800 capitalize">{user.role?.replace('_', ' ') || '–'}</p>
                    </div>
                </div>
            </div>

            {/* Assigned Tests - Cards */}
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    Tes yang Ditugaskan
                </h2>
                {assignments.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border">
                        <p className="text-gray-500 text-lg">Belum ada tes yang ditugaskan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {assignments.map((a) => {
                            const result = getResultForTest(a.test_id);

                            // Use is_complete flag from backend details
                            const isIncomplete = result?.details?.is_complete === false;
                            const answeredCount = result?.details?.answered_count;
                            const totalQuestions = result?.details?.total_questions;

                            // For DISC, also check if all quadrants are filled (personality completeness)
                            const isDiscIncomplete = a.test_code === 'DISC' &&
                                result?.details &&
                                (Object.keys(result.details.graph_i || {}).length < 4);
                            let statusColor, icon;
                            switch (a.status) {
                                case 'completed':
                                    statusColor = 'text-green-600 bg-green-50 border-green-200';
                                    icon = '✅';
                                    break;
                                case 'in_progress':
                                    statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';
                                    icon = '🔄';
                                    break;
                                case 'locked':
                                    statusColor = 'text-red-600 bg-red-50 border-red-200';
                                    icon = '🔒';
                                    break;
                                default:
                                    statusColor = 'text-gray-500 bg-gray-50 border-gray-200';
                                    icon = '📄';
                            }

                            return (
                                <div
                                    key={a.id}
                                    className={`border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${statusColor} p-5`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-gray-800">{a.test_name}</h4>
                                        <span className="text-lg">{icon}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-sm font-medium capitalize">
                                            Status: <span className="font-semibold">{a.status.replace('_', ' ')}</span>
                                        </p>
                                        {a.status !== 'pending' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReset(a.id, a.test_name);
                                                }}
                                                className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
                                                title="Reset this test"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* Score display */}
                                    {result && a.test_name !== "Temperament Test" && a.test_code !== 'LEAD' && !isDiscIncomplete && (
                                        <div className="mt-2 text-sm text-gray-700">
                                            {a.test_code === 'DISC' ? (
                                                <span className="text-gray-500">Asesmen kepribadian</span>
                                            ) : (
                                                <>
                                                    Skor: <span className="font-bold text-green-600">{result.score}</span> / {result.max_score || '?'}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Completion status - shown for ALL test types */}
                                    {result && answeredCount !== undefined && totalQuestions !== undefined && (
                                        <div className="mt-2 text-sm">
                                            <span className="font-medium">Soal:</span>{' '}
                                            <span className={`font-bold ${isIncomplete ? 'text-orange-600' : 'text-green-600'}`}>
                                                {answeredCount}/{totalQuestions}
                                            </span>
                                            {isIncomplete && (
                                                <span className="ml-2 text-xs text-orange-600 font-medium">Tidak Lengkap</span>
                                            )}
                                            {!isIncomplete && !isDiscIncomplete && (
                                                <span className="ml-2 text-xs text-green-600 font-medium">✓ Lengkap</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Incomplete warning message */}
                                    {(isIncomplete || isDiscIncomplete) && (
                                        <div className="mt-2 text-sm text-orange-600 font-medium">
                                            Peserta tidak menyelesaikan tes ini
                                        </div>
                                    )}

                                    {result && isDiscIncomplete && (
                                        <div className="mt-2 text-sm text-orange-600 font-medium">
                                            Profil DISC tidak lengkap (tidak semua soal dijawab)
                                        </div>
                                    )}

                                    {result && a.test_name === "Temperament Test" && (
                                        <div className="mt-2 text-sm">
                                            <span className="font-medium">Tipe:</span>{' '}
                                            <span className="font-bold text-purple-600">{result.details?.primary || 'Tidak Diketahui'}</span>
                                        </div>
                                    )}

                                    {result && a.test_name === "PAPI Kostick Test" && (
                                        <div className="mt-2 text-sm">
                                            <span className="font-medium">Sifat Utama:</span>{' '}
                                            <span className="font-bold text-indigo-600">{computePrimaryTrait(result.details) || '—'}</span>
                                        </div>
                                    )}

                                    {result && a.test_name === "IQ Test (CFIT)" && (
                                        <div className="mt-2 space-y-1 text-sm">
                                            <div>
                                                <span className="font-medium">IQ:</span>{' '}
                                                <span className="font-bold text-blue-600">{result.details?.iq || '?'}</span>
                                                {' — '}
                                                <span className="font-medium">{result.details?.classification || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Skor Mentah:</span>{' '}
                                                {result.details?.raw_score || '?'}/{result.details?.max_score || '?'}
                                            </div>
                                            {result.details?.section_scores && (
                                                <div className="flex gap-4 text-xs text-gray-500">
                                                    <span>Section 1 (P1–4): {result.details.section_scores.section_1.correct}/50</span>
                                                    <span>Section 2 (P5–8): {result.details.section_scores.section_2.correct}/50</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Detailed Results */}
            {results.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        Hasil Tes
                    </h2>
                    <div className="space-y-5">
                        {getLatestResults().map((r) => (
                            <div
                                key={r.id}
                                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
                            >
                                {/* Test Header */}
                                <div className="bg-gray-50 px-5 py-4 border-b">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                        <h3 className="text-xl font-semibold text-gray-800">{r.test_name}</h3>
                                        {r.max_score && r.test_name !== "PAPI Kostick Test" && (
                                            <div className="mt-2 md:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                                {r.score} / {r.max_score}
                                            </div>
                                        )}
                                        {r.test_name === "PAPI Kostick Test" && (
                                            <div className="mt-2 md:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                                                {computePrimaryTrait(r.details) || "Personality Profile"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DISC Assessment */}
                                {r.test_name === "DISC Assessment" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-4">Profil DISC</h4>

                                        {/* Legend */}
                                        <div className="flex gap-4 mb-6 text-xs">
                                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span> Grafik I (Publik)</div>
                                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-green-500 mr-1"></span> Grafik II (Alami)</div>
                                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-purple-500 mr-1"></span> Grafik III (Terintegrasi)</div>
                                        </div>

                                        {/* Tally Table */}
                                        <div className="overflow-x-auto mb-6">
                                            <table className="min-w-full border-collapse border border-gray-300">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Dimensi</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Grafik I (Tertinggi)</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Grafik II (Terendah)</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Grafik III (Int.)</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Perubahan (I–II)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {['D', 'I', 'S', 'C'].map(trait => {
                                                        const i = r.details.graph_i?.[trait] || 0;
                                                        const ii = r.details.graph_ii?.[trait] || 0;
                                                        const iii = r.details.graph_iii?.[trait] || 0;
                                                        const change = i - ii;
                                                        return (
                                                            <tr key={trait} className="hover:bg-gray-50">
                                                                <td className="border border-gray-300 px-3 py-2 font-medium">{trait}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-center">{i}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-center">{ii}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-center">{iii}</td>
                                                                <td className={`border border-gray-300 px-3 py-2 text-center ${change < 0 ? 'text-red-600' : change > 0 ? 'text-green-600' : ''}`}>
                                                                    {change}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Line Chart */}
                                        {(() => {
                                            const chartData = ['D', 'I', 'S', 'C'].map(trait => ({
                                                trait,
                                                'Grafik I (Publik)': r.details.graph_i?.[trait] || 0,
                                                'Grafik II (Alami)': r.details.graph_ii?.[trait] || 0,
                                                'Grafik III (Terintegrasi)': r.details.graph_iii?.[trait] || 0,
                                            }));

                                            return (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="trait" />
                                                        <YAxis domain={[0, 24]} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="Grafik I (Publik)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                                        <Line type="monotone" dataKey="Grafik II (Alami)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                                                        <Line type="monotone" dataKey="Grafik III (Terintegrasi)" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            );
                                        })()}

                                        {/* Stress Gap Indicator */}
                                        {r.details.stress_gap !== undefined && (
                                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border flex items-center">
                                                <div className="flex-1">
                                                    <span className="font-medium">Stress Gap:</span>
                                                    <span className={`ml-2 font-bold ${r.details.stress_gap > 10 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {Math.round(r.details.stress_gap)}
                                                    </span>
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        ({r.details.stress_gap > 10 ? 'Penyembunyian signifikan - mungkin menunjukkan stres' : 'Dalam rentang normal'})
                                                    </span>
                                                </div>
                                                {r.details.stress_gap > 5 && (
                                                    <div className="text-2xl ml-2 text-orange-500" title="Selisih antara Publik dan Alami">⚠️</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Speed Test */}
                                {r.test_name === "Speed Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Performa Tes Kecepatan</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Skor:</span> {r.details.score}</div>
                                            <div><span className="font-medium">Akurasi:</span> {r.details.accuracy}%</div>
                                            <div><span className="font-medium">Dijawab:</span> {r.details.total_answered}</div>
                                            <div>
                                                <span className="font-medium">Performa:</span>{' '}
                                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${r.details.band?.includes('Excellent')
                                                    ? 'bg-green-100 text-green-800'
                                                    : r.details.band?.includes('Good')
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : r.details.band?.includes('Average')
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {r.details.band}
                                                </span>
                                            </div>
                                        </div>
                                        {r.details.flag && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start">
                                                ⚠️ <span className="ml-1">{r.details.flag}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* PAPI Kostick */}
                                {r.test_name === "PAPI Kostick Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Profil PAPI Kostick</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            {Object.entries(r.details)
                                                .filter(([, val]) => typeof val === 'number' || typeof val === 'string')
                                                .map(([key, val]) => (
                                                    <div key={key} className="bg-gray-50 rounded p-2">
                                                        <span className="font-medium capitalize">{key}:</span>{' '}
                                                        <span className="font-bold">{val}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* IQ Test */}
                                {r.test_name === "IQ Test (CFIT)" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-4">Hasil Tes IQ</h4>

                                        {/* Main IQ Display */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-blue-600">{r.details.iq || '?'}</div>
                                                <div className="text-sm text-blue-700 mt-1">Skor IQ</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-gray-800">{r.details.raw_score || '?'}/{r.details.max_score || '?'}</div>
                                                <div className="text-sm text-gray-600 mt-1">Skor Mentah</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                                <div className="text-xl font-bold text-gray-800">{r.details.classification || '—'}</div>
                                                <div className="text-sm text-gray-600 mt-1">Klasifikasi</div>
                                            </div>
                                        </div>

                                        {/* Section Scores */}
                                        {r.details.section_scores && (
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="font-semibold text-sm text-gray-600 mb-2">Bagian 1 (Fase 1-4)</h5>
                                                    <div className="text-2xl font-bold">{r.details.section_scores.section_1.correct} / 50</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="font-semibold text-sm text-gray-600 mb-2">Bagian 2 (Fase 5-8)</h5>
                                                    <div className="text-2xl font-bold">{r.details.section_scores.section_2.correct} / 50</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Phase Scores */}
                                        {r.details.phase_scores && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-600 mb-3">Rincian Fase</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {Object.entries(r.details.phase_scores).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([phase, data]) => (
                                                        <div key={phase} className="bg-gray-50 rounded-lg p-3 text-center">
                                                            <div className="font-bold text-lg">{data.correct}</div>
                                                            <div className="text-xs text-gray-500">Fase {phase}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Temperament Test */}
                                {r.test_name === "Temperament Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Rincian Temperamen</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Utama:</span> {r.details.primary}</div>
                                            <div><span className="font-medium">Sekunder:</span> {r.details.secondary}</div>
                                        </div>
                                        <div className="mt-4">
                                            <h5 className="font-medium text-gray-700 mb-2">Intensitas Sifat</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                                {Object.entries(r.details.percentages || {}).map(([trait, pct]) => (
                                                    <div key={trait} className="flex justify-between">
                                                        <span className="capitalize">{trait}:</span>
                                                        <span className="font-bold">{Math.round(pct)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {r.details.straight_line_flag && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                Semua jawaban identik - terdeteksi pengisian seragam
                                            </div>
                                        )}
                                        {r.details.interactions?.length > 0 && (
                                            <div className="mt-3">
                                                <h5 className="font-medium text-gray-700">Catatan Interaksi</h5>
                                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                                    {r.details.interactions.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Memory Test */}
                                {r.test_name === "Memory Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Ringkasan Tes Memori</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium">Skor:</span> {r.details.score}
                                            </div>
                                            <div>
                                                <span className="font-medium">Akurasi:</span> {r.details.accuracy}%
                                            </div>
                                            <div>
                                                <span className="font-medium">Kategori:</span> {r.details.band}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Logic & Arithmetic Test */}
                                {r.test_name === "Logic & Arithmetic Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Performa Logika & Aritmatika</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Skor:</span> {r.details.score} / 100</div>
                                            <div><span className="font-medium">Benar:</span> {r.details.correct_count} / 50</div>
                                            <div><span className="font-medium">Persentase:</span> {r.details.percentage}%</div>
                                            <div>
                                                <span className="font-medium">Kategori:</span>{' '}
                                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${r.details.band?.includes('Excellent') ? 'bg-green-100 text-green-800' :
                                                    r.details.band?.includes('Good') ? 'bg-blue-100 text-blue-800' :
                                                        r.details.band?.includes('Average') ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {r.details.band}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* PAPI Kostick Test (LEAD) */}
                                {r.test_name === "PAPI Kostick Test" && r.details && r.details.categories && (
                                    <div className="p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                                            <h4 className="font-bold text-gray-700">Profil PAPI Kostick</h4>
                                            {computePrimaryTrait(r.details) && (
                                                <span className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
                                                    Sifat Utama: {computePrimaryTrait(r.details)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Radar Chart */}
                                        <div className="flex justify-center mb-6">
                                            <ResponsiveContainer width="100%" height={400}>
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                                    (() => {
                                                        // Flatten all categories into a single array for the radar
                                                        const chartData = [];
                                                        const categoryOrder = [
                                                            "Work Direction - Arah Kerja",
                                                            "Leadership - Kepemimpinan",
                                                            "Activity - Aktivitas Kerja",
                                                            "Social Nature - Relasi Sosial",
                                                            "Work Style - Gaya Kerja",
                                                            "Temperament - Sifat Temperamen",
                                                            "Followership - Posisi Atasan-Bawahan",
                                                        ];
                                                        categoryOrder.forEach(cat => {
                                                            if (r.details.categories[cat]) {
                                                                Object.entries(r.details.categories[cat]).forEach(([code, data]) => {
                                                                    chartData.push({
                                                                        trait: code,
                                                                        score: data.stanine,
                                                                        fullName: data.description?.split('—')[0]?.trim() || code,
                                                                    });
                                                                });
                                                            }
                                                        });
                                                        return chartData;
                                                    })()
                                                }>
                                                    <PolarGrid stroke="#e5e7eb" />
                                                    <PolarAngleAxis
                                                        dataKey="trait"
                                                        tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                                                    />
                                                    <PolarRadiusAxis
                                                        domain={[0, 10]}
                                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                                        tickCount={10}
                                                    />
                                                    <Radar
                                                        name="Role"
                                                        dataKey="score"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        fill="#3b82f6"
                                                        fillOpacity={0.25}
                                                    />
                                                    <Tooltip
                                                        formatter={(value, name, props) => [
                                                            `Stanine: ${value}`,
                                                            props.payload.fullName
                                                        ]}
                                                        contentStyle={{
                                                            borderRadius: '8px',
                                                            border: '1px solid #e5e7eb',
                                                            fontSize: '13px',
                                                        }}
                                                    />
                                                    <Legend
                                                        wrapperStyle={{ fontSize: '13px' }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {Object.entries(r.details.categories).map(([categoryName, norms]) => (
                                            <div key={categoryName} className="mb-6">
                                                <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-100">
                                                    {categoryName}
                                                </h5>
                                                <div className="space-y-2">
                                                    {Object.entries(norms).map(([normCode, normData]) => {
                                                        // Stanine color coding
                                                        const stanine = normData.stanine;
                                                        let barColor = 'bg-gray-300';
                                                        let textColor = 'text-gray-500';
                                                        if (stanine >= 7) { barColor = 'bg-emerald-500'; textColor = 'text-emerald-700'; }
                                                        else if (stanine >= 5) { barColor = 'bg-blue-500'; textColor = 'text-blue-700'; }
                                                        else if (stanine >= 3) { barColor = 'bg-amber-500'; textColor = 'text-amber-700'; }
                                                        else { barColor = 'bg-red-400'; textColor = 'text-red-600'; }

                                                        return (
                                                            <div key={normCode} className="flex items-center gap-3">
                                                                {/* Norm label */}
                                                                <div className="w-28 flex-shrink-0">
                                                                    <span className="text-sm font-semibold text-gray-800">{normCode}</span>
                                                                    <p className="text-[11px] text-gray-400 truncate" title={normData.description}>
                                                                        {normData.description?.split('—')[0]?.trim() || ''}
                                                                    </p>
                                                                </div>

                                                                {/* Stanine bar (9 segments) */}
                                                                <div className="flex-1 flex gap-0.5">
                                                                    {Array.from({ length: 9 }, (_, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className={`
                                                                                h-5 flex-1 rounded-sm transition-all
                                                                                ${i + 1 <= stanine ? barColor : 'bg-gray-100'}
                                                                            `}
                                                                        />
                                                                    ))}
                                                                </div>

                                                                {/* Stanine number */}
                                                                <div className={`w-8 text-right text-sm font-bold ${textColor}`}>
                                                                    {stanine}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Stanine legend */}
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                                            <span>Stanine:</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-400"></span> 1-2 Rendah</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-amber-500"></span> 3-4 Di Bawah Rata-rata</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500"></span> 5 Rata-rata</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span> 6-7 Di Atas Rata-rata</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span> 8-9 Tinggi</span>
                                        </div>
                                    </div>
                                )}
                                {/* Legacy Leadership Test results (deprecated, kept for backward compatibility with old data) */}
                                {r.test_name === "Leadership Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Profil Kepemimpinan</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                            <div><span className="font-medium">Kekuatan Utama:</span> {r.details.primary}</div>
                                            <div><span className="font-medium">Kekuatan Sekunder:</span> {r.details.secondary}</div>
                                        </div>
                                        <div className="mt-3">
                                            <span className="font-medium">Skor Sifat:</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                                {Object.entries(r.details.percentages || {}).map(([code, pct]) => {
                                                    const traitNames = {
                                                        DEC: 'Decisiveness',
                                                        COM: 'Communication',
                                                        STR: 'Strategic Thinking',
                                                        TEA: 'Team Orientation',
                                                        ACC: 'Accountability',
                                                        EMO: 'Emotional Control'
                                                    };
                                                    return (
                                                        <div key={code} className="bg-gray-50 p-2 rounded flex justify-between">
                                                            <span className="font-medium">{traitNames[code] || code}:</span>
                                                            <span>{Math.round(pct)}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {r.details.development_areas?.length > 0 && (
                                            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                                                Area pengembangan: {r.details.development_areas.map(code => {
                                                    const traitNames = {
                                                        DEC: 'Decisiveness',
                                                        COM: 'Communication',
                                                        STR: 'Strategic Thinking',
                                                        TEA: 'Team Orientation',
                                                        ACC: 'Accountability',
                                                        EMO: 'Emotional Control'
                                                    };
                                                    return traitNames[code] || code;
                                                }).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default ParticipantProfilePage;