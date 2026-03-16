// client/src/components/tests/StandardTest.jsx
import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestSession } from '../../hooks/useTestSession';
import { TestLayout, QuestionNavGrid, QuestionCard, TestFooter } from './TestLayout';

/**
 * Standard test component for single-choice tests (Leadership, IQ, etc.)
 * Uses shared test session logic and layout components
 * Note: Speed, DISC, Memory, Logic, Temperament have their own components
 */
export function StandardTest() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState(new Set());

  const handleTestComplete = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const {
    testData,
    questions,
    answers,
    setAnswers,
    timeLeft,
    loading,
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    isLocked,
    isFullscreen,
    enterFullscreen,
    handleSubmit,
    formatTime,
  } = useTestSession(assignmentId, {
    requireAllAnswers: true,
    onTestComplete: handleTestComplete
  });

  // All hooks must be called before any conditional returns
  const handleSelect = useCallback((optionId) => {
    const qId = questions[currentIndex]?.id;
    if (!qId) return;

    setAnswers(prev => ({ ...prev, [qId]: optionId }));

    // Auto-advance for speed tests
    if (testData?.settings?.type === 'speed') {
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setShowConfirmModal(true);
        }
      }, 200);
    }
  }, [questions, currentIndex, setAnswers, testData, setCurrentIndex, setShowConfirmModal]);

  const toggleFlag = useCallback(() => {
    const qId = questions[currentIndex]?.id;
    if (!qId) return;

    setFlagged(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qId)) {
        newSet.delete(qId);
      } else {
        newSet.add(qId);
      }
      return newSet;
    });
  }, [questions, currentIndex]);

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }, [questions]);

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleFinish = useCallback(() => {
    setShowConfirmModal(true);
  }, [setShowConfirmModal]);

  const handleConfirmSubmit = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!testData || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const showQuestionNav = testData?.settings?.type !== 'speed';

  return (
    <TestLayout
      testTitle={testData.test_name}
      timeLeft={timeLeft}
      formatTime={formatTime}
      isFullscreen={isFullscreen}
      isLocked={isLocked}
      onReturnFullscreen={enterFullscreen}
      showConfirmModal={showConfirmModal}
      setShowConfirmModal={setShowConfirmModal}
      onConfirmSubmit={handleConfirmSubmit}
      isSubmitting={isSubmitting}
      answeredCount={answeredCount}
      totalQuestions={questions.length}
    >
      {/* Question Navigation Grid */}
      {showQuestionNav && (
        <QuestionNavGrid
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onQuestionClick={goToQuestion}
          flagged={flagged}
        />
      )}

      {/* Question Card */}
      <QuestionCard
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        content={currentQuestion.content}
        options={currentQuestion.options}
        selectedAnswer={answers[currentQuestion.id]}
        onSelect={handleSelect}
        onFlag={toggleFlag}
        isFlagged={flagged.has(currentQuestion.id)}
        showFlag={testData?.settings?.type !== 'speed'}
      />

      {/* Footer Navigation */}
      {showQuestionNav && (
        <TestFooter
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onPrevious={goPrev}
          onNext={goNext}
          onFinish={handleFinish}
          isLastQuestion={isLastQuestion}
        />
      )}
    </TestLayout>
  );
}

export default StandardTest;
