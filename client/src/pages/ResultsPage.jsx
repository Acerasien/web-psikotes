// client/src/pages/ResultsPage.jsx
import ResultsTable from '../components/ResultsTable';

function ResultsPage({ token }) {
    return (
        <div className="space-y-6">
            <ResultsTable token={token} />
        </div>
    );
}

export default ResultsPage;