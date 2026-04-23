// client/src/components/tests/IQTest.jsx
import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useIQTestSession } from '../../hooks/useIQTestSession';
import { PhaseHub } from './PhaseHub';
import { PhaseTutorial } from './PhaseTutorial';
import { PhaseTest } from './PhaseTest';

/**
 * Top-level IQ test wrapper.
 * Routes between PhaseHub (phase list), PhaseTutorial (practice), and PhaseTest (timed questions).
 */
export function IQTest() {
  const { assignmentId } = useParams();

  const [currentView, setCurrentView] = useState('hub'); // 'hub' | 'tutorial' | 'test'
  const [activePhase, setActivePhase] = useState(null); // phase object

  const {
    testData,
    phases,
    loading,
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    isLocked,
    submitAll,
    syncAnswer,
    loadPhases,
  } = useIQTestSession(assignmentId);

  const handleStartTutorial = useCallback((phase) => {
    // Check if there's already progress for this phase
    const endKey = `iq_phase_${phase.id}_end`;
    const ansKey = `iq_phase_${phase.id}_answers`;
    const hasProgress = localStorage.getItem(endKey) || localStorage.getItem(ansKey);

    if (hasProgress) {
      setActivePhase(phase);
      setCurrentView('test');
    } else {
      setActivePhase(phase);
      setCurrentView('tutorial');
    }
  }, []);

  const handleStartTest = useCallback((phase) => {
    setActivePhase(phase);
    setCurrentView('test');
  }, []);

  const handleReturnToHub = useCallback(() => {
    setActivePhase(null);
    setCurrentView('hub');
    // Refresh phase statuses after completing a phase
    loadPhases();
  }, [loadPhases]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-blue-500 border-gray-800"></div>
      </div>
    );
  }

  if (!testData || phases.length === 0) {
    return null;
  }

  switch (currentView) {
    case 'tutorial':
      return (
        <PhaseTutorial
          phase={activePhase}
          assignmentId={assignmentId}
          onReturnToHub={handleReturnToHub}
          onStartTest={handleStartTest}
          isLocked={isLocked}
        />
      );
    case 'test':
      return (
        <PhaseTest
          phase={activePhase}
          assignmentId={assignmentId}
          onReturnToHub={handleReturnToHub}
          isLocked={isLocked}
          syncAnswer={syncAnswer}
        />
      );
    default:
      return (
        <PhaseHub
          phases={phases}
          testTitle={testData.test_name}
          onStartTutorial={handleStartTutorial}
          onSubmitAll={submitAll}
          isSubmitting={isSubmitting}
          showConfirmModal={showConfirmModal}
          setShowConfirmModal={setShowConfirmModal}
          isLocked={isLocked}
        />
      );
  }
}

export default IQTest;
