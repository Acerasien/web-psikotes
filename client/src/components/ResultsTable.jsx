// client/src/components/ResultsTable.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import { formatLocalDateTime } from '../utils/dateUtils';

/** Compute primary_trait from result details (fallback for old results) */
function computePrimaryTrait(details) {
    if (!details) return null;
    if (details.primary_trait) return details.primary_trait;
    
    const percentages = details.percentages;
    if (!percentages) return null;
    
    const entries = Object.entries(percentages);
    if (entries.length === 0) return null;
    
    // Find the maximum percentage
    const maxPct = Math.max(...entries.map(([, v]) => v));
    
    // If max percentage is 0 or all scores are tied and there are many of them, 
    // it's better not to list them all as "primary".
    if (maxPct === 0) return null;

    const topNorms = entries.filter(([, v]) => v === maxPct).map(([k]) => k);
    
    // If more than 3 traits are tied, just call it "Balanced" or return null for fallback
    if (topNorms.length > 3) {
        return "Multiple"; 
    }
    
    return topNorms.length === 1 ? topNorms[0] : topNorms.join(' & ');
}

function ResultsTable({ filters, onFilterChange, tests }) {
    const { token } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'completed_at', direction: 'desc' });
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Show 10 items per page

    // Fetch results when filters change
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const params = {};
                if (filters.testId) params.test_id = filters.testId;
                if (filters.search) params.search = filters.search;
                if (filters.fromDate) params.from_date = filters.fromDate;
                if (filters.toDate) params.to_date = filters.toDate;

                const res = await api.getResults(params);
                setResults(res.data);
                setCurrentPage(1); // Reset to first page when filters change
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [filters]);

    const parseDate = (d) => {
        if (!d) return 0;
        const normalized = d.endsWith('Z') ? d : d + 'Z';
        return new Date(normalized).getTime();
    };

    // Sorting function
    const sortedResults = [...results].sort((a, b) => {
        if (sortConfig.key === 'completed_at') {
            const dateA = parseDate(a.completed_at);
            const dateB = parseDate(b.completed_at);
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
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

    // Pagination logic
    const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button key={1} onClick={() => goToPage(1)} className="px-3 py-1 rounded hover:bg-gray-200">1</button>
            );
            if (startPage > 2) {
                pages.push(<span key="start-ellipsis" className="px-2">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`px-3 py-1 rounded ${currentPage === i ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="end-ellipsis" className="px-2">...</span>);
            }
            pages.push(
                <button key={totalPages} onClick={() => goToPage(totalPages)} className="px-3 py-1 rounded hover:bg-gray-200">{totalPages}</button>
            );
        }

        return pages;
    };

    const renderDetails = (result) => {
        // ... (unchanged, same as before)
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
                    <div><span className="font-medium">Akurasi:</span> {d.accuracy}%</div>
                    <div><span className="font-medium">Kategori:</span> {d.band}</div>
                    {d.flag && <div className="text-red-600">⚠️ {d.flag}</div>}
                </div>
            );
        }
        if (result.test_name.includes('Temperament')) {
            const d = result.details;
            if (!d) return null;
            return (
                <div className="p-2 bg-gray-50 rounded text-sm">
                    <div><span className="font-medium">Utama:</span> {d.primary}</div>
                    <div><span className="font-medium">Sekunder:</span> {d.secondary}</div>
                    <div className="mt-1">
                        <span className="font-medium">Persentase:</span>
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
                        <div className="mt-2 text-red-600">⚠️ Terdeteksi jawaban seragam</div>
                    )}
                </div>
            );
        }
        if (result.test_name.includes('Memory')) {
            const d = result.details;
            if (!d) return null;
            return (
                <div className="p-3 bg-gray-50 rounded text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">Skor:</span> {d.score} / 100</div>
                        <div><span className="font-medium">Benar:</span> {d.correct_count} / 25</div>
                        <div><span className="font-medium">Akurasi:</span> {d.accuracy}%</div>
                        <div>
                            <span className="font-medium">Kategori:</span>{' '}
                            <span className={`ml-1 px-2 py-0.5 rounded ${d.band?.includes('Excellent') ? 'bg-green-100 text-green-800' :
                                d.band?.includes('Good') ? 'bg-blue-100 text-blue-800' :
                                    d.band?.includes('Average') ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {d.band}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        // Legacy Leadership test results (deprecated, kept for backward compatibility)
        if (result.test_name.includes('Leadership')) {
            const d = result.details;
            if (!d) return null;
            return (
                <div className="p-3 bg-gray-50 rounded text-sm">
                    <div><span className="font-medium">Utama:</span> {d.primary}</div>
                    <div><span className="font-medium">Sekunder:</span> {d.secondary}</div>
                    <div className="mt-2">
                        <span className="font-medium">Persentase:</span>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                            {Object.entries(d.percentages || {}).map(([trait, pct]) => (
                                <div key={trait} className="flex justify-between">
                                    <span>{trait}:</span>
                                    <span>{Math.round(pct)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {d.development_areas?.length > 0 && (
                        <div className="mt-2 text-orange-600">⚠️ Area Pengembangan: {d.development_areas.join(', ')}</div>
                    )}
                </div>
            );
        }
        return <div className="text-sm text-gray-500">Tidak ada detail tambahan</div>;
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Hasil Tes</h3>
            </div>

            {/* Filters - Stack on mobile */}
            <div className="p-4 bg-gray-50 border-b grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                    type="text"
                    placeholder="Cari peserta..."
                    value={filters.search}
                    onChange={e => onFilterChange({ ...filters, search: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                    value={filters.testId}
                    onChange={e => onFilterChange({ ...filters, testId: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="">Semua Tes</option>
                    {tests.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={filters.fromDate}
                    onChange={e => onFilterChange({ ...filters, fromDate: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="From"
                />
                <input
                    type="date"
                    value={filters.toDate}
                    onChange={e => onFilterChange({ ...filters, toDate: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="To"
                />
            </div>

            {/* Mobile Card View - shows on screens < lg */}
            <div className="lg:hidden divide-y divide-gray-200">
                {loading && (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2 text-sm">Memuat hasil...</p>
                    </div>
                )}

                {!loading && paginatedResults.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Tidak ada hasil ditemukan.</p>
                    </div>
                )}

                {!loading && paginatedResults.map(result => (
                    <div key={result.id} className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/participants/${result.user_id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm block truncate max-w-[200px]"
                                    title={result.full_name || result.username}
                                >
                                    {result.full_name || result.username}
                                </Link>
                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]" title={result.test_name}>{result.test_name}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-lg font-bold text-green-600">
                                    {computePrimaryTrait(result.details) ? (
                                        <span className="text-sm">{computePrimaryTrait(result.details)}</span>
                                    ) : result.details?.primary ? (
                                        <span>{result.details.primary}</span>
                                    ) : result.max_score ? (
                                        <span>{result.score} / {result.max_score}</span>
                                    ) : (
                                        <span>{result.score}</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
                                </div>
                            </div>
                        </div>

                        {/* Date and actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatLocalDateTime(result.completed_at, 'dd MMM yyyy')}
                            </div>
                            <button
                                onClick={() => toggleRow(result.id)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 bg-blue-50 rounded"
                            >
                                {expandedRows.has(result.id) ? 'Sembunyikan' : 'Detail'}
                                <svg className={`w-3.5 h-3.5 transition-transform ${expandedRows.has(result.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Expanded details */}
                        {expandedRows.has(result.id) && (
                            <div className="pt-2 bg-gray-50 rounded-lg p-3">
                                {renderDetails(result)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination - Mobile */}
            {!loading && paginatedResults.length > 0 && (
                <div className="lg:hidden p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-700">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <span className="text-sm text-gray-500">
                            {startIndex + 1}-{Math.min(endIndex, sortedResults.length)} dari {sortedResults.length}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sebelumnya
                        </button>
                        <div className="flex items-center gap-1">
                            {renderPageNumbers()}
                        </div>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Table View - hidden on mobile */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('participant')}>
                                Peserta {sortConfig.key === 'participant' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('score')}>
                                Skor {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('time_taken')}>
                                Waktu {sortConfig.key === 'time_taken' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('completed_at')}>
                                Selesai {sortConfig.key === 'completed_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedResults.length === 0 && (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada hasil ditemukan.</td></tr>
                        )}
                        {paginatedResults.map(result => (
                            <>
                                <tr key={result.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap max-w-[200px]">
                                        <Link 
                                            to={`/participants/${result.user_id}`} 
                                            className="text-blue-600 hover:underline truncate block"
                                            title={result.full_name || result.username}
                                        >
                                            {result.full_name || result.username}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate" title={result.test_name}>
                                        {result.test_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                        {computePrimaryTrait(result.details) ? (
                                            <span>{computePrimaryTrait(result.details)}</span>
                                        ) : result.details?.primary ? (
                                            <span>{result.details.primary}</span>
                                        ) : result.max_score ? (
                                            <span>{result.score} / {result.max_score}</span>
                                        ) : (
                                            <span>{result.score}</span>
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
                                            className="text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            {expandedRows.has(result.id) ? 'Sembunyikan detail' : 'Tampilkan detail'}
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

            {/* Pagination - Desktop */}
            {!loading && paginatedResults.length > 0 && (
                <div className="hidden lg:flex items-center justify-between px-6 py-4 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                        Menampilkan <span className="font-medium">{startIndex + 1}</span> hingga{' '}
                        <span className="font-medium">{Math.min(endIndex, sortedResults.length)}</span> dari{' '}
                        <span className="font-medium">{sortedResults.length}</span> hasil
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                        >
                            Sebelumnya
                        </button>
                        <div className="flex items-center gap-1">
                            {renderPageNumbers()}
                        </div>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResultsTable;
