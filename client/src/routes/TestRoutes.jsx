// client/src/routes/TestRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { StandardTest } from '../components/tests/StandardTest';
import { SpeedTest } from '../components/tests/SpeedTest';
import DISCTest from '../components/DISCTest';
import MemoryTest from '../components/MemoryTest';
import LogicTest from '../components/LogicTest';
import TemperamentTest from '../components/TemperamentTest';
import TestTypeRouter from './TestTypeRouter';

/**
 * Test routes configuration
 * TestTypeRouter determines which component to render based on test_code
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
