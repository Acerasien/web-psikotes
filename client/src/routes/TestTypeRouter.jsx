// client/src/routes/TestTypeRouter.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { SpeedTest } from '../components/tests/SpeedTest';
import DISCTest from '../components/DISCTest';
import MemoryTest from '../components/MemoryTest';
import LogicTest from '../components/LogicTest';
import TemperamentTest from '../components/TemperamentTest';
import PapiKostickTest from '../components/tests/PapiKostickTest';
import { StandardTest } from '../components/tests/StandardTest';
import { IQTest } from '../components/tests/IQTest';

/**
 * Router component that determines which test component to render
 * based on the test_code from the assignment
 */
export function TestTypeRouter() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [testCode, setTestCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestType = async () => {
      try {
        const res = await api.getMyAssignments();
        const assignment = res.data.find(a => a.id === parseInt(assignmentId));
        if (assignment) {
          // Guard: Redirect to dashboard if test is already completed
          if (assignment.status === 'completed') {
            navigate('/dashboard', { replace: true });
            return;
          }
          setTestCode(assignment.test_code);
        }
      } catch (err) {
        console.error('Failed to load test type:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTestType();
  }, [assignmentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Route to specialized test components based on test_code
  // All tests now use useNavigate() internally, no onFinish props needed
  switch (testCode) {
    case 'SPEED':
      return <SpeedTest assignmentId={assignmentId} />;
    case 'DISC':
      return <DISCTest assignmentId={assignmentId} />;
    case 'MEM':
      return <MemoryTest assignmentId={assignmentId} />;
    case 'LOGIC':
      return <LogicTest assignmentId={assignmentId} />;
    case 'TEMP':
      return <TemperamentTest assignmentId={assignmentId} />;
    case 'LEAD':
      return <PapiKostickTest assignmentId={assignmentId} />;
    case 'IQ':
      return <IQTest />;
    default:
      // Fallback for unknown test types
      return <StandardTest />;
  }
}

export default TestTypeRouter;
