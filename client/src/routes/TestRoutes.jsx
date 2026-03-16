// client/src/routes/TestRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { StandardTest } from '../components/tests/StandardTest';

/**
 * Test routes configuration
 * All test types are accessed via /test/:assignmentId
 * The test component determines which UI to show based on test_code
 */
export function TestRoutes() {
  return (
    <Routes>
      {/* All tests use the same route pattern */}
      <Route path=":assignmentId" element={<StandardTest />} />
      
      {/* Catch-all: redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default TestRoutes;
