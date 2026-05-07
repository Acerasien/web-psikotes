import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import ResultsTable from '../components/ResultsTable';

function ResultsPage() {
    const { token, canSeeResults } = useAuth();
    const [tests, setTests] = useState([]);
    const [filters, setFilters] = useState({
        testId: '',
        search: '',
        fromDate: '',
        toDate: ''
    });
    const [exporting, setExporting] = useState(false);

    // Fetch tests for filter dropdown
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await api.getTests();
                setTests(res.data);
            } catch (err) {
                console.error('Failed to fetch tests', err);
            }
        };
        fetchTests();
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = {};
            if (filters.testId) params.test_id = filters.testId;
            if (filters.search) params.search = filters.search;
            if (filters.fromDate) params.from_date = filters.fromDate;
            if (filters.toDate) params.to_date = filters.toDate;

            const response = await api.exportResults(params);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'results.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Ekspor gagal. Periksa konsol untuk detail.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-neutral-900 uppercase tracking-tight">Hasil Pengujian</h2>
                    <p className="text-neutral-500 text-sm mt-1 font-medium">Lihat dan analisis performa peserta secara real-time.</p>
                </div>
                {canSeeResults && (
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className={`group flex items-center gap-2 bg-success hover:bg-success-dark text-white font-black uppercase text-xs tracking-widest px-6 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95 ${exporting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        <svg className={`w-4 h-4 transition-transform group-hover:-translate-y-0.5 ${exporting ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {exporting ? 'MENGEKSPOR...' : 'EKSPOR CSV'}
                    </button>
                )}
            </div>

            {/* Pass filters and setFilters down to ResultsTable */}
            <div className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden">
                <ResultsTable
                    filters={filters}
                    onFilterChange={setFilters}
                    tests={tests}
                />
            </div>
        </div>
    );
}

export default ResultsPage;
