import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ParticipantProfilePage({ token, currentUserRole }) {   // Added currentUserRole prop
    const { id } = useParams();
    const navigate = useNavigate();
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
            const response = await axios.get(`http://127.0.0.1:8000/admin/export/participant/${id}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user?.username || 'participant'}_report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to export PDF.', 'error');
        } finally {
            setPdfExporting(false);
        }
    };

    // Export handler
    const handleExportParticipant = async () => {
        setExporting(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/admin/export/participant/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user?.username || 'participant'}_results.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to export results.', 'error');
        } finally {
            setExporting(false);
        }
    };

    // Define loadParticipantData FIRST using useCallback
    const loadParticipantData = useCallback(async () => {
        try {
            setLoading(true);
            const userRes = await axios.get(`http://127.0.0.1:8000/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(userRes.data);

            const assignRes = await axios.get(`http://127.0.0.1:8000/assignments/?user_id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(assignRes.data);

            const resultsRes = await axios.get(`http://127.0.0.1:8000/results/?user_id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(resultsRes.data);
        } catch (err) {
            console.error('Error loading participant data:', err);
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    // Load data on mount and when id/token changes
    useEffect(() => {
        loadParticipantData();
    }, [loadParticipantData]);

    const getResultForTest = (testId) => {
        return results.find(r => r.test_id === testId);
    };

    // Define handleReset AFTER loadParticipantData
    const handleReset = async (assignmentId, testName) => {
        const result = await Swal.fire({
            title: 'Reset Test?',
            text: `Are you sure you want to reset "${testName}"? All answers and results will be deleted, and the participant can retake it.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, reset'
        });

        if (result.isConfirmed) {
            try {
                await axios.post(`http://127.0.0.1:8000/admin/assignments/${assignmentId}/reset`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Reset!', 'Test has been reset.', 'success');
                loadParticipantData(); // refresh data
            } catch (err) {
                console.error('Reset error:', err);
                Swal.fire('Error', 'Could not reset test.', 'error');
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
                ❌ User not found
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800">
                    ← Back
                </button>
                {/* Show export button only if the logged-in user is superadmin */}
                {currentUserRole === 'superadmin' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportParticipant}
                            disabled={exporting}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                        >
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={pdfExporting}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                        >
                            {pdfExporting ? 'Generating...' : 'Export PDF'}
                        </button>
                    </div>
                )}
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
                        <span className="font-medium text-gray-500">Gender:</span> {user.gender || '-'}
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Age</span>
                        <p className="text-gray-800">{user.age || '–'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Education</span>
                        <p className="text-gray-800">{user.education || '–'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-500">Role</span>
                        <p className="text-gray-800 capitalize">{user.role?.replace('_', ' ') || '–'}</p>
                    </div>
                </div>
            </div>

            {/* Assigned Tests - Cards */}
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    📋 Assigned Tests
                </h2>
                {assignments.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border">
                        <p className="text-gray-500 text-lg">No tests assigned yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {assignments.map((a) => {
                            const result = getResultForTest(a.test_id);
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

                                    {result && a.test_name !== "Temperament Test" && (
                                        <div className="mt-2 text-sm text-gray-700">
                                            Score: <span className="font-bold text-green-600">{result.score}</span> / {result.max_score}
                                        </div>
                                    )}

                                    {result && a.test_name === "Temperament Test" && (
                                        <div className="mt-2 text-sm">
                                            <span className="font-medium">Type:</span>{' '}
                                            <span className="font-bold text-purple-600">{result.details?.primary || 'Unknown'}</span>
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
                        📊 Test Results
                    </h2>
                    <div className="space-y-5">
                        {results.map((r) => (
                            <div
                                key={r.id}
                                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
                            >
                                {/* Test Header */}
                                <div className="bg-gray-50 px-5 py-4 border-b">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                        <h3 className="text-xl font-semibold text-gray-800">{r.test_name}</h3>
                                        {r.max_score && (
                                            <div className="mt-2 md:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                                {r.score} / {r.max_score}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DISC Assessment */}
                                {r.test_name === "DISC Assessment" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-4">DISC Profile</h4>

                                        {/* Legend */}
                                        <div className="flex gap-4 mb-6 text-xs">
                                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span> Graph I (Public)</div>
                                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-green-500 mr-1"></span> Graph II (Natural)</div>
                                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-purple-500 mr-1"></span> Graph III (Integrated)</div>
                                        </div>

                                        {/* Tally Table */}
                                        <div className="overflow-x-auto mb-6">
                                            <table className="min-w-full border-collapse border border-gray-300">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Dimensi</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Graph I (Most)</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Graph II (Least)</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Graph III (Int.)</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Change (I–II)</th>
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
                                                'Graph I (Public)': r.details.graph_i?.[trait] || 0,
                                                'Graph II (Natural)': r.details.graph_ii?.[trait] || 0,
                                                'Graph III (Integrated)': r.details.graph_iii?.[trait] || 0,
                                            }));

                                            return (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="trait" />
                                                        <YAxis domain={[0, 24]} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="Graph I (Public)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                                        <Line type="monotone" dataKey="Graph II (Natural)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                                                        <Line type="monotone" dataKey="Graph III (Integrated)" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
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
                                                        ({r.details.stress_gap > 10 ? 'Significant masking – may indicate stress' : 'Within normal range'})
                                                    </span>
                                                </div>
                                                {r.details.stress_gap > 5 && (
                                                    <div className="text-2xl ml-2 text-orange-500" title="Gap between Public and Natural">⚠️</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Speed Test */}
                                {r.test_name === "Speed Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Speed Test Performance</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Score:</span> {r.details.score}</div>
                                            <div><span className="font-medium">Accuracy:</span> {r.details.accuracy}%</div>
                                            <div><span className="font-medium">Answered:</span> {r.details.total_answered}</div>
                                            <div>
                                                <span className="font-medium">Performance:</span>{' '}
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

                                {/* Temperament Test */}
                                {r.test_name === "Temperament Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Temperament Breakdown</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Primary:</span> {r.details.primary}</div>
                                            <div><span className="font-medium">Secondary:</span> {r.details.secondary}</div>
                                        </div>
                                        <div className="mt-4">
                                            <h5 className="font-medium text-gray-700 mb-2">Trait Intensities</h5>
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
                                                ⚠️ All answers were identical – straight-lining detected
                                            </div>
                                        )}
                                        {r.details.interactions?.length > 0 && (
                                            <div className="mt-3">
                                                <h5 className="font-medium text-gray-700">Interaction Notes</h5>
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
                                        <h4 className="font-bold text-gray-700 mb-3">Memory Test Summary</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium">Score:</span> {r.details.score}
                                            </div>
                                            <div>
                                                <span className="font-medium">Accuracy:</span> {r.details.accuracy}%
                                            </div>
                                            <div>
                                                <span className="font-medium">Band:</span> {r.details.band}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Logic & Arithmetic Test */}
                                {r.test_name === "Logic & Arithmetic Test" && r.details && (
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-700 mb-3">Logic & Arithmetic Performance</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Score:</span> {r.details.score} / 100</div>
                                            <div><span className="font-medium">Correct:</span> {r.details.correct_count} / 25</div>
                                            <div><span className="font-medium">Percentage:</span> {r.details.percentage}%</div>
                                            <div>
                                                <span className="font-medium">Band:</span>{' '}
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
                                {/* Leadership Test */}
                                {r.test_name === "Leadership Test" && r.details && (
                                    <div className="p-5">
                                        {(() => {
                                            const traitNames = {
                                                DEC: 'Decisiveness',
                                                COM: 'Communication',
                                                STR: 'Strategic Thinking',
                                                TEA: 'Team Orientation',
                                                ACC: 'Accountability',
                                                EMO: 'Emotional Control'
                                            };
                                            return (
                                                <>
                                                    <h4 className="font-bold text-gray-700 mb-3">Leadership Profile</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                                        <div><span className="font-medium">Primary Strength:</span> {r.details.primary}</div>
                                                        <div><span className="font-medium">Secondary Strength:</span> {r.details.secondary}</div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <span className="font-medium">Trait Scores:</span>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                                            {Object.entries(r.details.percentages || {}).map(([code, pct]) => (
                                                                <div key={code} className="bg-gray-50 p-2 rounded flex justify-between">
                                                                    <span className="font-medium">{traitNames[code] || code}:</span>
                                                                    <span>{Math.round(pct)}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {r.details.development_areas?.length > 0 && (
                                                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                                                            ⚠️ Development areas: {r.details.development_areas.map(code => traitNames[code] || code).join(', ')}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
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