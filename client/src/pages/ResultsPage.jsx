import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import ResultsTable from '../components/ResultsTable';

function ResultsPage() {
    const { token, isSuperadmin: currentUserRole } = useAuth();
    const [tests, setTests] = useState([]);
    const [filters, setFilters] = useState({
        testId: '',
        search: '',
        fromDate: '',
        toDate: ''
    });
    const [exporting, setExporting] = useState(false);

    // Fetch tests for filter dropdown (optional, but nice)
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hasil Tes</h2>
                {currentUserRole === 'superadmin' && (
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${exporting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {exporting ? 'Mengekspor...' : 'Ekspor CSV'}
                    </button>
                )}
            </div>

            {/* Pass filters and setFilters down to ResultsTable */}
            <ResultsTable
                filters={filters}
                onFilterChange={setFilters}
                tests={tests}
            />
        </div>
    );
}

export default ResultsPage;
