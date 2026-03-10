import { useState, useEffect } from 'react';
import axios from 'axios';
import ResultsTable from '../components/ResultsTable';

function ResultsPage({ token, currentUserRole }) {
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

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (filters.testId) params.append('test_id', filters.testId);
            if (filters.search) params.append('search', filters.search);
            if (filters.fromDate) params.append('from_date', filters.fromDate);
            if (filters.toDate) params.append('to_date', filters.toDate);

            const response = await axios.get(`http://127.0.0.1:8000/admin/export/results?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

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
            alert('Export failed. Check console for details.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Test Results</h2>
                {currentUserRole === 'superadmin' && (
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${exporting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                )}
            </div>

            {/* Pass filters and setFilters down to ResultsTable */}
            <ResultsTable
                token={token}
                filters={filters}
                onFilterChange={setFilters}
                tests={tests}
            />
        </div>
    );
}

export default ResultsPage;