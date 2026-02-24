// client/src/TestScreen.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function TestScreen({ token, assignmentId, onFinish }) {
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // New state for modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

    // --- INTEGRITY LOGIC ---

  // 1. Force Fullscreen on Mount
  useEffect(() => {
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
    };
    
    if (!loading) {
      enterFullscreen();
    }
  }, [loading]);

  // 2. Detect Fullscreen Exit
    // 2. Detect Fullscreen Exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      
      if (!isCurrentlyFullscreen && !isLocked && !loading) {
        const newCount = exitCount + 1;
        setExitCount(newCount);
        
        if (newCount >= 3) {
          setIsLocked(true);
          // CALL API TO LOCK IN DATABASE
          axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/lock`, {}, {
             headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.error("Failed to lock assignment", err));
          
          Swal.fire({
            title: 'Test Locked',
            text: 'You have exited fullscreen too many times.',
            icon: 'error',
            allowOutsideClick: false
          });
        } 
        else {
          setIsFullscreen(false);
          // Warning Toast
          Swal.fire({
            title: `Warning ${newCount}/3`,
            text: 'Please return to fullscreen immediately!',
            icon: 'warning',
            timer: 3000,
            timerProgressBar: true
          });
        }
      } else if (isCurrentlyFullscreen) {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [exitCount, isLocked, loading, assignmentId, token]); // Add dependencies

  // 3. Disable Right-Click and Shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === "F12" || 
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) || 
          (e.ctrlKey && (e.key === "U" || e.key === "u"))) {
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
  

    // 1. Load Test Data
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/assignments/${assignmentId}/start`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTestData(res.data);
        setTimeLeft(res.data.time_limit);
        setLoading(false);
      } catch (err) {
        // NEW: Check if error is 403 (Locked)
        if (err.response && err.response.status === 403 && err.response.data.detail.includes("locked")) {
            setIsLocked(true); // Show locked screen immediately
            setLoading(false); // Stop loading spinner
        } else {
            console.error("Failed to start test", err);
            onFinish(); // Go back to dashboard for other errors
        }
      }
    };
    loadTest();
  }, [token, assignmentId]);

  // 2. Timer Logic (Same as before)
    // 2. Timer Logic
  useEffect(() => {
    // UPDATE: Only run if NOT loading, time left, AND NOT paused/locked
    if (!loading && timeLeft > 0 && isFullscreen && !isLocked) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0 && !loading) {
      handleSubmit(answers, true); 
    }
  }, [timeLeft, loading, isFullscreen, isLocked]); // Add dependencies

  // 3. Handle Answer Selection
  const handleSelect = (optionId) => {
    const currentQuestionId = testData.questions[currentIndex].id;
    const newAnswers = { ...answers, [currentQuestionId]: optionId };
    setAnswers(newAnswers);

    // Auto-Next for Speed Test
    if (testData.settings?.type === 'speed') {
      setTimeout(() => {
        if (currentIndex < testData.questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Last question? Open Confirmation Modal instead of submitting immediately
          setShowConfirmModal(true);
        }
      }, 200);
    }
  };

  // 4. Handle Submit
  const handleSubmit = async (currentAnswers = answers, isTimeout = false) => {
  setIsSubmitting(true); // Start loading
  const timeTaken = testData.time_limit - timeLeft;
  try {
    await axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/submit`, 
      { answers: currentAnswers, time_taken: timeTaken },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // REMOVE THE ALERTS HERE
    // Just call onFinish to go back
    onFinish(); 
    
  } catch (err) {
    console.error(err);
    setIsSubmitting(false); // Stop loading on error so they can try again
    alert("Submission failed. Please check your connection.");
  }
    };  

  if (loading) return <div className="p-8 text-center">Loading Test...</div>;

  // --- NEW SAFETY CHECK ---
  // If the test is locked, show the lock screen immediately and stop.
  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
        <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
        <p className="mb-2">You have exited fullscreen too many times.</p>
        <p className="text-gray-400">Please contact the administrator to unlock your attempt.</p>
        <button 
          onClick={onFinish}
          className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const currentQuestion = testData.questions[currentIndex];
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">{testData.test_name}</h1>
        <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* NEW: Question Indicator Grid */}
      {testData.settings?.type !== 'speed' && (
      <div className="bg-gray-50 border-b p-2 flex justify-center space-x-1 overflow-x-auto">
        {testData.questions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => testData.settings?.type !== 'speed' && setCurrentIndex(idx)} // Can only click if NOT speed test
            className={`w-8 h-8 flex items-center justify-center text-xs font-bold border rounded ${
              answers[q.id] 
                ? 'bg-green-500 text-white border-green-500' // Answered
                : 'bg-white text-gray-500 border-gray-300'  // Unanswered
            } ${
              idx === currentIndex ? 'ring-2 ring-blue-400' : '' // Highlight current
            } ${testData.settings?.type !== 'speed' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      )}

      {/* Question Area */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        {/* ... existing question card ... */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
          <p className="text-sm text-gray-500 mb-2">Question {currentIndex + 1} of {testData.questions.length}</p>
          
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.content}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left p-4 border rounded-lg transition ${
                  answers[currentQuestion.id] === opt.id 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="font-bold mr-2">{opt.label}.</span> {opt.content}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white p-4 shadow flex justify-between items-center">
        {testData.settings?.type !== 'speed' && (
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
        )}
        
        <div className="text-gray-600 flex-grow text-center">
          {Object.keys(answers).length} / {testData.questions.length} Answered
        </div>

        {testData.settings?.type !== 'speed' && (
           currentIndex === testData.questions.length - 1 ? (
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
          )
        )}
      </div>

    {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4">Submit Test?</h3>
            <p className="mb-6 text-gray-600">
              You have answered {Object.keys(answers).length} out of {testData.questions.length} questions.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 rounded font-medium"
                disabled={isSubmitting} // Disable cancel while submitting
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isSubmitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* LOCKOUT OVERLAY */}
      {isLocked && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
          <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
          <p className="mb-2">You have exited fullscreen too many times.</p>
          <p className="text-gray-400">Please contact the administrator to unlock your attempt.</p>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {!isFullscreen && !isLocked && !loading && (
         <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
            <h2 className="text-2xl font-bold mb-4">Paused</h2>
            <p>Please click the button below to return to fullscreen mode.</p>
            <button 
                onClick={() => {
                    const elem = document.documentElement;
                    if (elem.requestFullscreen) elem.requestFullscreen();
                }}
                className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold"
            >
                Return to Fullscreen
            </button>
         </div>
      )}
    </div>
  );
}

export default TestScreen;