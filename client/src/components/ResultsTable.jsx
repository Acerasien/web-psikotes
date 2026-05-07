// client/src/components/ResultsTable.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import { formatLocalDateTime } from '../utils/dateUtils';

/** Compute primary_trait from result details (fallback for old results) */
function computePrimaryTrait(result) {
    if (!result || !result.details) return null;
    const d = result.details;

    // DISC
    if (result.test_name.includes('DISC')) {
        const g3 = d.graph_iii;
        if (!g3) return null;
        return Object.entries(g3).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    
    // IQ
    if (result.test_name.includes('CFIT') || result.test_name.includes('IQ Pola')) {
        return `IQ ${d.iq || 0}`;
    }

    // Logic / WPT
    if (result.test_name.includes('WPT') || result.test_name.includes('Aritmatika')) {
        return `IQ ${d.iq || d.est_iq || 0}`;
    }

    // Temperament
    if (result.test_name.includes('Temperament')) {
        return d.primary || null;
    }

    return null;
}

function ResultsTable({ filters, onFilterChange, tests }) {
    const { token } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'completed_at', direction: 'desc' });
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
                setCurrentPage(1); 
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [filters]);

    const sortedResults = [...results].sort((a, b) => {
        if (sortConfig.key === 'completed_at') {
            const dateA = new Date(a.completed_at);
            const dateB = new Date(b.completed_at);
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
    });

    const paginatedResults = sortedResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const renderDetails = (result) => {
        const d = result.details;
        if (!d) return <div className="text-neutral-400 text-xs italic">Tidak ada detail tersedia.</div>;

        // 1. IQ TEST (CFIT)
        if (result.test_name.includes('CFIT') || result.test_name.includes('IQ Pola')) {
            return (
                <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl p-6 text-neutral-900 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Skor IQ</span>
                            <div className="text-3xl font-black text-primary-600">{d.iq || 0}</div>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Klasifikasi</span>
                            <div className="text-xl font-black uppercase text-neutral-800">{d.classification || 'Average'}</div>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Skor Mentah</span>
                            <div className="text-xl font-black text-neutral-800">{d.raw_score || 0} / 100</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Analisis Per-Fase</h4>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(phase => {
                                const ps = d.phase_scores?.[phase] || { correct: 0, answered: 0 };
                                return (
                                    <div key={phase} className="bg-white p-2 rounded-xl text-center border border-neutral-100 shadow-sm">
                                        <div className="text-[9px] font-black text-neutral-400 mb-1">F{phase}</div>
                                        <div className="text-xs font-black text-neutral-700">{ps.correct}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        // 2. DISC PERSONALITY
        if (result.test_name.includes('DISC')) {
            return (
                <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl p-6 text-neutral-900 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        {['D', 'I', 'S', 'C'].map(trait => {
                            const val = d.percentages?.[trait] || 0;
                            const zone = d.intensity_zones?.[trait] || 'Medium';
                            return (
                                <div key={trait} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">{trait}</span>
                                    <div className="text-2xl font-black text-neutral-800">{Math.round(val)}%</div>
                                    <div className={`mt-2 text-[9px] font-black px-2 py-1 rounded-lg uppercase inline-block ${zone === 'High' ? 'bg-success-light text-success-dark' : zone === 'Low' ? 'bg-error-light text-error-dark' : 'bg-warning-light text-warning-dark'}`}>
                                        {zone}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // 3. TEMPERAMENT
        if (result.test_name.includes('Temperament')) {
            return (
                <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl p-6 text-neutral-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Profil Dominan</h4>
                            <div className="bg-primary-50 border border-primary-100 p-6 rounded-3xl">
                                <div className="text-3xl font-black uppercase mb-1 text-primary-700">{d.primary}</div>
                                <div className="text-xs font-bold text-primary-600/80">Karakteristik Utama</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Distribusi Persentase</h4>
                            <div className="space-y-3">
                                {Object.entries(d.percentages || {}).map(([trait, val]) => (
                                    <div key={trait}>
                                        <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-neutral-600">
                                            <span>{trait}</span>
                                            <span>{Math.round(val)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 transition-all duration-1000" style={{ width: `${val}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // 4. SPEED / MEMORY / ACCURACY BASED
        if (result.test_name.includes('Speed') || result.test_name.includes('Memory')) {
            return (
                <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl p-6 text-neutral-900">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Akurasi</span>
                            <div className="text-2xl font-black text-success-dark">{d.accuracy || d.score}%</div>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Kategori</span>
                            <div className="text-lg font-black uppercase text-neutral-800">{d.band || 'Average'}</div>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Benar</span>
                            <div className="text-lg font-black text-neutral-800">{d.correct_count || 0}</div>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Durasi</span>
                            <div className="text-lg font-black uppercase text-neutral-800">{(result.time_taken / 60).toFixed(1)}m</div>
                        </div>
                    </div>
                    {d.flag && (
                        <div className="mt-6 p-4 bg-error-light/30 border border-error-light rounded-2xl flex items-center gap-3">
                            <svg className="w-5 h-5 text-error-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span className="text-xs font-black uppercase tracking-tight text-error-dark">{d.flag}</span>
                        </div>
                    )}
                </div>
            );
        }

        // FALLBACK: Clean Key-Value Display
        return (
            <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Metadata Hasil</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Object.entries(d).filter(([k]) => typeof d[k] !== 'object').map(([key, value]) => (
                        <div key={key}>
                            <span className="text-[9px] font-black text-neutral-400 uppercase block mb-1">{key.replace('_', ' ')}</span>
                            <span className="text-xs font-bold text-neutral-800">{String(value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const PaginationControls = () => {
        const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
        return (
            <div className="px-6 py-5 bg-white border-t border-neutral-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Baris:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border-2 border-neutral-100 rounded-xl px-3 py-1.5 text-xs font-black focus:ring-0 focus:border-primary-500 bg-neutral-50"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 border-2 border-neutral-100 rounded-xl disabled:opacity-30 hover:bg-neutral-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                    <span className="text-xs font-black text-neutral-900 px-4">{currentPage} / {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border-2 border-neutral-100 rounded-xl disabled:opacity-30 hover:bg-neutral-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                </div>
            </div>
        );
    };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Debounce search term to prevent API spam on every keystroke
    useEffect(() => {
        const handler = setTimeout(() => {
            if (filters.search !== searchTerm) {
                onFilterChange({ ...filters, search: searchTerm });
            }
        }, 500); // 500ms delay

        return () => clearTimeout(handler);
    }, [searchTerm, filters, onFilterChange]);

    return (
        <div className="bg-white">
            <div className="p-6 bg-neutral-50/50 border-b border-neutral-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                    type="text" 
                    placeholder="Cari peserta..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border-2 border-neutral-100 focus:border-primary-500 rounded-2xl text-sm font-bold outline-none" 
                />
                <select value={filters.testId} onChange={e => onFilterChange({ ...filters, testId: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-neutral-100 focus:border-primary-500 rounded-2xl text-sm font-bold outline-none cursor-pointer">
                    <option value="">Semua Jenis Tes</option>
                    {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input type="date" value={filters.fromDate} onChange={e => onFilterChange({ ...filters, fromDate: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-neutral-100 focus:border-primary-500 rounded-2xl text-sm font-bold outline-none" />
                <input type="date" value={filters.toDate} onChange={e => onFilterChange({ ...filters, toDate: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-neutral-100 focus:border-primary-500 rounded-2xl text-sm font-bold outline-none" />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/30">
                            <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Peserta</th>
                            <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Pengujian</th>
                            <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Hasil Utama</th>
                            <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Tanggal</th>
                            <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                            {paginatedResults.map(result => (
                                <div key={result.id} style={{ display: 'contents' }}>
                                    <tr className="group hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link to={`/participants/${result.user_id}`} className="font-black text-neutral-900 uppercase text-xs tracking-tight hover:text-primary-600 transition-colors">
                                                {result.full_name || result.username}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase">{result.test_name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-success-light text-success-dark font-black text-[11px] uppercase tracking-tighter">
                                                {computePrimaryTrait(result) || result.score}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[11px] font-bold text-neutral-600 uppercase">
                                            {formatLocalDateTime(result.completed_at, 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => toggleRow(result.id)} className={`p-2 rounded-xl transition-all ${expandedRows.has(result.id) ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>
                                                <svg className={`w-4 h-4 transition-transform ${expandedRows.has(result.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.has(result.id) && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-6 bg-neutral-50/50">
                                                <div className="max-w-4xl mx-auto">{renderDetails(result)}</div>
                                            </td>
                                        </tr>
                                    )}
                                </div>
                            ))}
                    </tbody>
                </table>
            </div>
            {!loading && <PaginationControls />}
        </div>
    );
}

export default ResultsTable;
