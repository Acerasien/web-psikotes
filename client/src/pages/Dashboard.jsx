// client/src/pages/Dashboard.jsx
function Dashboard() {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <p className="text-gray-600">
                Welcome to the admin dashboard. This page will soon display statistics,
                charts, and an overview of platform activity.
            </p>
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-700">
                    <strong>Coming soon:</strong> Total participants, tests taken,
                    average scores, recent activity, and more.
                </p>
            </div>
        </div>
    );
}

export default Dashboard;