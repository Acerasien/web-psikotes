// client/src/components/ResultsTable.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// import { format } from 'date-fns';
import { formatLocalDateTime } from '../utils/dateUtils';

function ResultsTable({ token }) {
    const [results, setResults] = useState([]);
    const [tests, setTests] = useState([]);
    const [filters, setFilters] = useState({
        testId: '',
        search: '',
        fromDate: '',
        toDate: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: 'completed_at', direction: 'desc' });
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Fetch tests for filter dropdown
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:8000/tests/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTests(res.data);
            } catch (err) {
                console.error('Failed to fetch tests', err);
            }
        };
        fetchTests();
    }, [token]);

    // Fetch results with filters
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const params = new URLSearchParams();
                if (filters.testId) params.append('test_id', filters.testId);
                if (filters.search) params.append('search', filters.search);
                if (filters.fromDate) params.append('from_date', filters.fromDate);
                if (filters.toDate) params.append('to_date', filters.toDate);

                const res = await axios.get(`http://127.0.0.1:8000/results/?${params}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResults(res.data);
            } catch (err) {
                console.error('Failed to fetch results', err);
            }
        };
        fetchResults();
    }, [filters, token]);

    // Sorting function
    const sortedResults = [...results].sort((a, b) => {
        if (sortConfig.key === 'completed_at') {
            return sortConfig.direction === 'asc'
                ? new Date(a.completed_at) - new Date(b.completed_at)
                : new Date(b.completed_at) - new Date(a.completed_at);
        }
        if (sortConfig.key === 'score') {
            return sortConfig.direction === 'asc'
                ? a.score - b.score
                : b.score - a.score;
        }
        if (sortConfig.key === 'time_taken') {
            return sortConfig.direction === 'asc'
                ? a.time_taken - b.time_taken
                : b.time_taken - a.time_taken;
        }
        if (sortConfig.key === 'participant') {
            const nameA = a.full_name || a.username;
            const nameB = b.full_name || b.username;
            if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const renderDetails = (result) => {
        if (!result.details) return null;
        if (result.test_name.includes('DISC')) {
            const d = result.details;
            return (
                <div className="p-2 bg-gray-50 rounded">
                    <div className="grid grid-cols-4 gap-2 text-center mb-2">
                        {['D', 'I', 'S', 'C'].map(trait => (
                            <div key={trait}>
                                <span className="font-bold">{trait}</span>
                                <div>{Math.round(d.percentages?.[trait] || 0)}%</div>
                                <span className={`text-xs px-1 rounded ${d.intensity_zones?.[trait] === 'High' ? 'bg-green-200' :
                                    d.intensity_zones?.[trait] === 'Low' ? 'bg-red-200' : 'bg-yellow-200'
                                    }`}>
                                    {d.intensity_zones?.[trait] || 'Medium'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">Stress Gap:</span> {Math.round(d.stress_gap || 0)}
                    </div>
                </div>
            );
        }
        if (result.test_name.includes('Speed')) {
            const d = result.details;
            return (
                <div className="p-2 bg-gray-50 rounded text-sm">
                    <div><span className="font-medium">Accuracy:</span> {d.accuracy}%</div>
                    <div><span className="font-medium">Band:</span> {d.band}</div>
                    {d.flag && <div className="text-red-600">⚠️ {d.flag}</div>}
                </div>
            );
        }
        if (result.test_name.includes('Temperament')) {
            const d = result.details;
            if (!d) return null;
            return (
                <div className="p-2 bg-gray-50 rounded text-sm">
                    <div><span className="font-medium">Primary:</span> {d.primary}</div>
                    <div><span className="font-medium">Secondary:</span> {d.secondary}</div>
                    <div className="mt-1">
                        <span className="font-medium">Percentages:</span>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                            {Object.entries(d.percentages || {}).map(([trait, pct]) => (
                                <div key={trait} className="flex justify-between">
                                    <span>{trait}:</span>
                                    <span>{Math.round(pct)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {d.straight_line_flag && (
                        <div className="mt-2 text-red-600">⚠️ Straight-lining detected</div>
                    )}
                </div>
            );
        }
        return <div className="text-sm text-gray-500">No additional details</div>;
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Test Results</h3>
            </div>

            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search participant..."
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    className="border rounded px-3 py-2"
                />
                <select
                    value={filters.testId}
                    onChange={e => setFilters({ ...filters, testId: e.target.value })}
                    className="border rounded px-3 py-2"
                >
                    <option value="">All Tests</option>
                    {tests.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={filters.fromDate}
                    onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                    className="border rounded px-3 py-2"
                    placeholder="From"
                />
                <input
                    type="date"
                    value={filters.toDate}
                    onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                    className="border rounded px-3 py-2"
                    placeholder="To"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('participant')}>
                                Participant {sortConfig.key === 'participant' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Test
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('score')}>
                                Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('time_taken')}>
                                Time {sortConfig.key === 'time_taken' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('completed_at')}>
                                Completed {sortConfig.key === 'completed_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedResults.length === 0 && (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No results found.</td></tr>
                        )}
                        {sortedResults.map(result => (
                            <>
                                <tr key={result.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link to={`/participants/${result.user_id}`} className="text-blue-600 hover:underline">
                                            {result.full_name || result.username}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.test_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                        {result.test_name.includes('Temperament') && result.details?.primary ? (
                                            <span>{result.details.primary}</span>
                                        ) : (
                                            <span>{result.score} / {result.total_questions}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatLocalDateTime(result.completed_at, 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            onClick={() => toggleRow(result.id)}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            {expandedRows.has(result.id) ? 'Hide details' : 'Show details'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRows.has(result.id) && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                            {renderDetails(result)}
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultsTable;