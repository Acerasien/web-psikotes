// client/src/routes/TestRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import TestTypeRouter from './TestTypeRouter';

/**
 * Test routes configuration
 * TestTypeRouter determines which test component to render based on test_code
 */
export function TestRoutes() {
  return (
    <Routes>
      {/* Main test route - uses router component to determine test type */}
      <Route path=":assignmentId" element={<TestTypeRouter />} />

      {/* Catch-all: redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default TestRoutes;
