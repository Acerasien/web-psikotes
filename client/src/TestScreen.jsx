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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // --- HELPERS ---

  // Helper to format DISC answers for backend
  const formatDiscPayload = (answersObj) => {
    const payload = [];
    Object.keys(answersObj).forEach(qId => {
      const selection = answersObj[qId];
      if (selection.most) {
        payload.push({ question_id: parseInt(qId), option_id: selection.most, type: 'most' });
      }
      if (selection.least) {
        payload.push({ question_id: parseInt(qId), option_id: selection.least, type: 'least' });
      }
    });
    return payload;
  };

  // Handler specifically for DISC Radio Buttons
  const handleDiscRadio = (questionId, optionId, type) => {
    setAnswers(prev => {
      const currentQ = prev[questionId] || { most: null, least: null };
      let newMost = currentQ.most;
      let newLeast = currentQ.least;

      if (type === 'most') {
        newMost = optionId;
        if (newLeast === optionId) newLeast = null; // Can't be both
      } else {
        newLeast = optionId;
        if (newMost === optionId) newMost = null; // Can't be both
      }
      return { ...prev, [questionId]: { most: newMost, least: newLeast } };
    });
  };

  // --- INTEGRITY LOGIC ---

  useEffect(() => {
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    };
    if (!loading) enterFullscreen();
  }, [loading]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      if (!isCurrentlyFullscreen && !isLocked && !loading) {
        const newCount = exitCount + 1;
        setExitCount(newCount);

        // Log this exit to the server
        axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/exit-log`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error("Failed to log exit", err));
        if (newCount >= 3) {
          setIsLocked(true);
          axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/lock`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.error(err));
          Swal.fire({ title: 'Test Locked', text: 'You have exited fullscreen too many times.', icon: 'error', allowOutsideClick: false });
        } else {
          setIsFullscreen(false);
          Swal.fire({ title: `Warning ${newCount}/3`, text: 'Please return to fullscreen immediately!', icon: 'warning', timer: 3000, timerProgressBar: true });
        }
      } else if (isCurrentlyFullscreen) {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [exitCount, isLocked, loading, assignmentId, token]);

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
        const res = await axios.get(`http://127.0.0.1:8000/assignments/${assignmentId}/start`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTestData(res.data);
        if (res.data.time_limit === 0) setTimeLeft(null);
        else setTimeLeft(res.data.time_limit);
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 403 && err.response.data.detail.includes("locked")) {
          setIsLocked(true);
          setLoading(false);
        } else {
          onFinish();
        }
      }
    };
    loadTest();
  }, [token, assignmentId]);

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
    } else {
      // Default Logic (IQ, Logic, etc)
      setAnswers({ ...answers, [currentQuestionId]: optionId });
    }
  };

  const handleSubmit = async (currentAnswers = answers, isTimeout = false) => {
    setIsSubmitting(true);
    const timeTaken = testData.time_limit === 0 ? 0 : testData.time_limit - timeLeft;
    try {
      let finalAnswers = currentAnswers;
      if (testData.settings?.type === 'disc') {
        finalAnswers = formatDiscPayload(currentAnswers);
      } else {
        finalAnswers = Object.keys(currentAnswers).map(qId => ({
          question_id: parseInt(qId),
          option_id: currentAnswers[qId],
          type: 'single'
        }));
      }

      await axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/submit`,
        { answers: finalAnswers, time_taken: timeTaken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (isTimeout) Swal.fire("Time is up!", "Your test has been submitted.", "info");
      onFinish();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      Swal.fire("Error", "Failed to submit test.", "error");
    }
  };

  // --- RENDER ---

  if (loading) return <div className="p-8 text-center">Loading Test...</div>;
  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
        <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
        <p className="mb-2">You have exited fullscreen too many times.</p>
        <button onClick={onFinish} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Back to Dashboard</button>
      </div>
    );
  }

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

      {/* Question Indicator Grid (Hidden for DISC and Speed) */}
      {testData.settings?.type !== 'speed' && testData.settings?.type !== 'disc' && (
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

      {/* QUESTION AREA */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto">

        {/* VIEW 1: DISC TABLE VIEW */}
        {testData.settings?.type === 'disc' ? (
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Pilih yang PALING SESUAI (P) dan PALING TIDAK SESUAI (K)</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left w-12">No</th>
                    <th className="border p-2 text-left">Gambaran Diri</th>
                    <th className="border p-2 text-center w-16">P</th>
                    <th className="border p-2 text-center w-16">K</th>
                  </tr>
                </thead>
                <tbody>
                  {testData.questions.map((q, qIdx) => (
                    <>
                      {q.options.map((opt, optIdx) => {
                        // Determine color state
                        const isMost = answers[q.id]?.most === opt.id;
                        const isLeast = answers[q.id]?.least === opt.id;

                        let rowClass = "hover:bg-gray-50";
                        if (isMost) rowClass = "bg-green-100 border-green-300"; // Green for Most
                        if (isLeast) rowClass = "bg-red-100 border-red-300"; // Red for Least

                        return (
                          <tr key={opt.id} className={rowClass}>
                            <td className="border p-3 text-center text-gray-500 font-bold">
                              {optIdx === 0 ? qIdx + 1 : ""}
                            </td>
                            <td className="border p-3">
                              {opt.content}
                            </td>
                            {/* P Column (Most) */}
                            <td
                              className="border p-3 text-center cursor-pointer select-none"
                              onClick={() => handleDiscRadio(q.id, opt.id, 'most')}
                            >
                              {/* Visual Box instead of radio */}
                              <div className={`w-6 h-6 mx-auto rounded border-2 flex items-center justify-center ${isMost ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'}`}>
                                {isMost && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                              </div>
                            </td>
                            {/* K Column (Least) */}
                            <td
                              className="border p-3 text-center cursor-pointer select-none"
                              onClick={() => handleDiscRadio(q.id, opt.id, 'least')}
                            >
                              <div className={`w-6 h-6 mx-auto rounded border-2 flex items-center justify-center ${isLeast ? 'bg-red-500 border-red-600' : 'bg-white border-gray-300'}`}>
                                {isLeast && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Separator */}
                      {qIdx < testData.questions.length - 1 && (
                        <tr><td colSpan="4" className="border-b-4 border-gray-200"></td></tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  // Check all questions
                  let missing = [];
                  testData.questions.forEach((q, idx) => {
                    if (!answers[q.id]?.most || !answers[q.id]?.least) {
                      // Use idx + 1 for the display number (1-24)
                      missing.push(idx + 1);
                    }
                  });

                  if (missing.length > 0) {
                    Swal.fire({
                      title: "Belum Lengkap",
                      html: `Anda belum mengisi pertanyaan nomor: <strong>${missing.join(", ")}</strong>`,
                      icon: "warning"
                    });
                    return;
                  }

                  setShowConfirmModal(true);
                }}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-8 rounded text-lg"
              >
                Selesai & Kirim
              </button>
            </div>
          </div>
        ) : (

          /* VIEW 2: DEFAULT CARD VIEW (Speed/IQ) */
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
        )}
      </div>

      {/* Footer Navigation (Hidden for DISC) */}
      {testData.settings?.type !== 'disc' && (
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
      )}

      {/* Modals & Overlays */}
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

      {!isFullscreen && !isLocked && !loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
          <h2 className="text-2xl font-bold mb-4">Paused</h2>
          <p>Please return to fullscreen mode.</p>
          <button onClick={() => { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }} className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold">Return to Fullscreen</button>
        </div>
      )}
    </div>
  );
}

export default TestScreen;