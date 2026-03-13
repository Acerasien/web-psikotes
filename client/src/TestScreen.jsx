// client/src/TestScreen.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { api } from './utils/api';
import Swal from 'sweetalert2';
import { useFullscreenLock } from './hooks/useFullscreenLock';

function TestScreen({ assignmentId, onFinish }) {
  const { token } = useAuth();
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLocked, isFullscreen, enterFullscreen } = useFullscreenLock({
    assignmentId,
    token
  });

  // --- HELPERS ---
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Prevent context menu and dev tools
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) || (e.ctrlKey && (e.key === "U" || e.key === "u"))) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await api.startTest(assignmentId);

        // Shuffle questions only for Leadership test
        let testDataFromServer = res.data;
        if (testDataFromServer.settings?.type === 'leadership') {
          testDataFromServer = {
            ...testDataFromServer,
            questions: shuffleArray([...testDataFromServer.questions])
          };
        }

        setTestData(testDataFromServer);
        if (res.data.time_limit === 0) setTimeLeft(null);
        else setTimeLeft(res.data.time_limit);
        setLoading(false);
        enterFullscreen();
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 403 && err.response.data.detail.includes("locked")) {
          setLoading(false);
        } else {
          onFinish();
        }
      }
    };
    loadTest();
  }, [assignmentId, enterFullscreen, onFinish]);

  // --- TIMER ---
  useEffect(() => {
    if (timeLeft === null || loading || !isFullscreen || isLocked) return;
    if (timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0) {
      handleSubmit(answers, true);
    }
  }, [timeLeft, loading, isFullscreen, isLocked]);

  // --- INTERACTION LOGIC ---
  const handleSelect = (optionId) => {
    const currentQuestionId = testData.questions[currentIndex].id;
    if (testData.settings?.type === 'speed') {
      const newAnswers = { ...answers, [currentQuestionId]: optionId };
      setAnswers(newAnswers);
      setTimeout(() => {
        if (currentIndex < testData.questions.length - 1) setCurrentIndex(currentIndex + 1);
        else setShowConfirmModal(true);
      }, 200);
    } else if (testData.settings?.type === 'temperament') {
      setAnswers({ ...answers, [currentQuestionId]: optionId });
      setTimeout(() => {
        if (currentIndex < testData.questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setShowConfirmModal(true);
        }
      }, 200);
    } else if (testData.settings?.type === 'leadership') {
      setAnswers({ ...answers, [currentQuestionId]: optionId });
      setTimeout(() => {
        if (currentIndex < testData.questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setShowConfirmModal(true);
        }
      }, 200);
    } else {
      setAnswers({ ...answers, [currentQuestionId]: optionId });
    }
  };

  const handleSubmit = async (currentAnswers = answers, isTimeout = false) => {
    // Check if all questions answered
    const answeredCount = Object.keys(currentAnswers).length;
    const totalQuestions = testData?.questions?.length || 0;
    
    if (!isTimeout && totalQuestions > 0 && answeredCount < totalQuestions) {
      Swal.fire({
        title: 'Belum Lengkap',
        text: `Anda baru menjawab ${answeredCount} dari ${totalQuestions} pertanyaan.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsSubmitting(true);
    const timeTaken = testData.time_limit === 0 ? 0 : testData.time_limit - timeLeft;
    try {
      const finalAnswers = Object.keys(currentAnswers).map(qId => ({
        question_id: parseInt(qId),
        option_id: currentAnswers[qId],
        type: 'single'
      }));

      await api.submitTest(assignmentId, finalAnswers, timeTaken);

      if (isTimeout) Swal.fire("Time is up!", "Your test has been submitted.", "info");
      onFinish();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      Swal.fire("Error", "Failed to submit test.", "error");
    }
  };

  // --- RENDER ---
  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
        <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
        <p className="mb-2">You have exited fullscreen too many times.</p>
        <button onClick={onFinish} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Back to Dashboard</button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Loading Test...</div>;

  const currentQuestion = testData.questions[currentIndex];
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">{testData.test_name}</h1>
        <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
          {timeLeft !== null ? formatTime(timeLeft) : "Unlimited Time"}
        </div>
      </div>

      {/* Question Indicator Grid (Hidden for Speed) */}
      {testData.settings?.type !== 'speed' && (
        <div className="bg-gray-50 border-b p-2 flex justify-center space-x-1 overflow-x-auto">
          {testData.questions.map((q, idx) => (
            <div
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 flex items-center justify-center text-xs font-bold border rounded cursor-pointer ${answers[q.id] ? 'bg-green-500 text-white' : 'bg-white text-gray-500'
                } ${idx === currentIndex ? 'ring-2 ring-blue-400' : ''}`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      )}

      {/* QUESTION AREA - Default Card View */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
          <p className="text-sm text-gray-500 mb-2">Question {currentIndex + 1} of {testData.questions.length}</p>
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.content}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((opt) => {
              let btnClass = "bg-white hover:bg-gray-50 border-gray-200";
              if (answers[currentQuestion.id] === opt.id) {
                btnClass = "bg-blue-500 text-white border-blue-500";
              }
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left p-4 border rounded-lg transition ${btnClass}`}
                >
                  <span className="font-bold mr-2">{opt.label}.</span> {opt.content}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation (Hidden for Speed) */}
      {testData.settings?.type !== 'speed' && (
        <div className="bg-white p-4 shadow flex justify-between items-center">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>

          <div className="text-gray-600 flex-grow text-center">
            {Object.keys(answers).length} / {testData.questions.length} Answered
          </div>

          {currentIndex === testData.questions.length - 1 ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600"
            >
              Finish Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
            >
              Next
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4">Submit Test?</h3>
            <p className="mb-6 text-gray-600">
              You have answered {Object.keys(answers).length} questions.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-200 rounded font-medium" disabled={isSubmitting}>Cancel</button>
              <button onClick={() => handleSubmit()} disabled={isSubmitting} className={`px-4 py-2 text-white rounded font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}>
                {isSubmitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {!isFullscreen && !isLocked && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
          <h2 className="text-2xl font-bold mb-4">Paused</h2>
          <p>Please return to fullscreen mode.</p>
          <button onClick={() => { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }} className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold hover:bg-blue-600">
            Return to Fullscreen
          </button>
        </div>
      )}
    </div>
  );
}

export default TestScreen;