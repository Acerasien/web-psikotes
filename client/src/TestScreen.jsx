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

  // Check if fullscreen is supported (for UI messaging)
  const isFullscreenSupported = !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.msRequestFullscreen
  );

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

        // Shuffle questions only for PAPI Kostick test
        let testDataFromServer = res.data;
        if (testDataFromServer.settings?.type === 'papi_kostick') {
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
    } else if (testData.settings?.type === 'papi_kostick') {
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
        <h2 className="text-3xl font-bold mb-4">Tes Terkunci</h2>
        <p className="mb-2">Anda terlalu sering keluar dari mode layar penuh.</p>
        <button onClick={onFinish} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Kembali ke Dashboard</button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Memuat Tes...</div>;

  const currentQuestion = testData.questions[currentIndex];
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow px-3 sm:p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-bold text-base sm:text-lg truncate max-w-[150px] sm:max-w-none">{testData.test_name}</h1>
        <div className="text-base sm:text-xl font-mono bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded text-sm sm:text-base">
          {timeLeft !== null ? formatTime(timeLeft) : "∞"}
        </div>
      </div>

      {/* Question Indicator Grid - Wrapping grid for all test types */}
      {testData.settings?.type !== 'speed' && (
        <div className="bg-gray-50 border-b px-3 sm:px-4 py-2 sm:py-3 overflow-x-auto">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-start sm:justify-center">
            {testData.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center text-xs font-bold rounded-full transition-all ${
                  answers[q.id] 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                } ${idx === currentIndex ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUESTION AREA */}
      <div className="flex-1 p-3 sm:p-6 flex flex-col items-center justify-center overflow-y-auto">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full max-w-2xl">
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            Pertanyaan {currentIndex + 1} dari {testData.questions.length}
          </p>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 leading-relaxed">
            {currentQuestion.content}
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left p-3 sm:p-4 border-2 rounded-lg transition-all min-h-[48px] sm:min-h-[52px] ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className={`font-bold mr-2 sm:mr-3 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                    {opt.label}.
                  </span>
                  <span className="text-sm sm:text-base">{opt.content}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation (Hidden for Speed) */}
      {testData.settings?.type !== 'speed' && (
        <div className="bg-white border-t px-3 sm:p-4 shadow flex justify-between items-center safe-area-pb">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
              currentIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline ml-1">Sebelumnya</span>
          </button>

          <div className="text-xs sm:text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
            {Object.keys(answers).length} / {testData.questions.length}
          </div>

          {currentIndex === testData.questions.length - 1 ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 sm:px-5 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 shadow-sm transition min-h-[44px] min-w-[44px]"
            >
              Selesai
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-3 sm:px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 shadow-sm transition min-h-[44px] min-w-[44px] flex items-center gap-1"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Selesaikan Tes?</h3>
            <p className="mb-6 text-gray-600 text-sm sm:text-base">
              Anda telah menjawab <span className="font-semibold">{Object.keys(answers).length}</span> dari <span className="font-semibold">{testData.questions.length}</span> pertanyaan.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition min-h-[44px] flex-1"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button 
                onClick={() => handleSubmit()} 
                className={`px-5 py-2.5 text-white rounded-lg font-semibold transition min-h-[44px] flex-1 ${
                  isSubmitting ? 'bg-gray-400 cursor-wait' : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Overlay - Only show if fullscreen is supported */}
      {!isFullscreen && !isLocked && isFullscreenSupported && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white p-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Dijeda</h2>
          <p className="mb-6 text-gray-200 text-center text-sm sm:text-base">Harap kembali ke mode layar penuh.</p>
          <button
            onClick={enterFullscreen}
            className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition min-h-[48px] min-w-[48px]"
          >
            Kembali ke Layar Penuh
          </button>
        </div>
      )}

      {/* Info banner for unsupported browsers (e.g., iOS Safari) */}
      {!isFullscreen && !isLocked && !isFullscreenSupported && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white p-3 text-center text-sm z-40">
          ⚠️ Mode layar penuh tidak didukung di browser Anda. Harap jangan berpindah tab.
        </div>
      )}
    </div>
  );
}

export default TestScreen;