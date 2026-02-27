// client/src/components/MemoryTest.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function MemoryTest({ token, assignmentId, onFinish }) {
    const [testData, setTestData] = useState(null);
    const [phase, setPhase] = useState('encoding'); // 'encoding' or 'recall'
    const [encodingTimeLeft, setEncodingTimeLeft] = useState(0);
    const [recallTimeLeft, setRecallTimeLeft] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Integrity state
    const [exitCount, setExitCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true);

    // --- Fullscreen helpers ---
    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    };

    // Handle answer selection (auto‑next)
    const handleSelect = (optionId) => {
        const qId = questions[currentIndex]?.id;
        if (!qId) return;

        setAnswers(prev => ({ ...prev, [qId]: optionId }));

        // Auto‑next after 200ms (only if not last question)
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setShowConfirm(true);
            }
        }, 200);
    };

    // Navigation functions
    const goToQuestion = (index) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        }
    };

    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // --- Load test data ---
    useEffect(() => {
        const loadTest = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/assignments/${assignmentId}/start`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestData(res.data);
                setQuestions(res.data.questions || []);
                setEncodingTimeLeft(res.data.settings?.encoding_time || 180);
                setRecallTimeLeft(res.data.settings?.recall_time || 600);
                setLoading(false);
                // Enter fullscreen after load
                enterFullscreen();
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403 && err.response.data.detail.includes("locked")) {
                    setIsLocked(true);
                    setLoading(false);
                } else {
                    // Show alert if API fails completely
                    Swal.fire('Error', 'Gagal memuat tes.', 'error');
                    onFinish();
                }
            }
        };
        loadTest();
    }, [token, assignmentId, onFinish]);

    // --- Fullscreen change listener ---
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = document.fullscreenElement !== null;

            // Only warn if we aren't locked, loading, or just started
            if (!isCurrentlyFullscreen && !isLocked && !loading && testData) {
                const newCount = exitCount + 1;
                setExitCount(newCount);

                // Log the exit
                axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/exit-log`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(err => console.error("Failed to log exit", err));

                if (newCount >= 3) {
                    setIsLocked(true);
                    axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/lock`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => console.error(err));
                    Swal.fire({
                        title: 'Test Locked',
                        text: 'You have exited fullscreen too many times.',
                        icon: 'error',
                        allowOutsideClick: false
                    });
                } else {
                    setIsFullscreen(false);
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
    }, [exitCount, isLocked, loading, testData, assignmentId, token]);

    // --- Prevent context menu and dev tools ---
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
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

    // --- Encoding timer ---
    useEffect(() => {
        if (phase !== 'encoding' || encodingTimeLeft <= 0 || isLocked) return;
        const timer = setInterval(() => {
            setEncodingTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('recall');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, encodingTimeLeft, isLocked]);

    // --- Recall timer ---
    useEffect(() => {
        if (phase !== 'recall' || recallTimeLeft <= 0 || isLocked) return;
        const timer = setInterval(() => {
            setRecallTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Auto-submit when time runs out
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, recallTimeLeft, isLocked]);

    const handleSubmit = async (isTimeout = false) => {
        setIsSubmitting(true);
        try {
            const payload = {
                answers: Object.keys(answers).map(qId => ({
                    question_id: parseInt(qId),
                    option_id: answers[qId],
                    type: 'single'
                })),
                time_taken: testData.settings?.recall_time - recallTimeLeft
            };
            await axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/submit`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (isTimeout) {
                Swal.fire('Waktu Habis', 'Tes telah dikirim otomatis.', 'info');
            } else {
                Swal.fire('Sukses', 'Jawaban Anda telah disimpan.', 'success');
            }
            onFinish();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal mengirim jawaban.', 'error');
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        if (seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getTableRows = (tableData) => {
        if (!tableData) return 0;
        let maxLength = 0;
        Object.values(tableData).forEach(arr => {
            if (arr && arr.length > maxLength) maxLength = arr.length;
        });
        return maxLength;
    };

    // --- Locked screen ---
    if (isLocked) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
                <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
                <p className="mb-2">You have exited fullscreen too many times.</p>
                <button onClick={onFinish} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // --- Encoding Phase ---
    if (phase === 'encoding') {
        const tableData = testData.settings?.table_data;
        const maxRows = getTableRows(tableData);

        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <div className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
                    <h1 className="font-bold text-lg">Memory Test - Fase Menghafal</h1>
                    <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
                        {formatTime(encodingTimeLeft)}
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-auto pb-24">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold mb-4 text-center">Tabel Hafalan</h2>
                        {tableData ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            {Object.keys(tableData).map((cat, catIdx) => (
                                                <th key={catIdx} className="border border-gray-300 px-4 py-2 text-sm font-semibold">
                                                    {cat}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(maxRows)].map((_, rowIdx) => (
                                            <tr key={rowIdx}>
                                                {Object.keys(tableData).map((cat, colIdx) => {
                                                    const items = tableData[cat];
                                                    const item = items && items[rowIdx] !== undefined ? items[rowIdx] : '';
                                                    return (
                                                        <td key={`${cat}-${rowIdx}`} className="border border-gray-300 px-4 py-2 text-sm text-center">
                                                            {item}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">No table data available.</p>
                        )}
                        <p className="mt-4 text-center text-gray-600">
                            Hafalkan tabel di atas. Anda akan diberikan {questions.length} pertanyaan setelah waktu habis.
                        </p>
                    </div>
                </div>

                {/* Fullscreen overlay warning */}
                {!isFullscreen && !isLocked && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white pointer-events-auto">
                        <h2 className="text-2xl font-bold mb-4">Paused</h2>
                        <p>Please return to fullscreen mode.</p>
                        <button
                            onClick={() => enterFullscreen()}
                            className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold hover:bg-blue-600"
                        >
                            Return to Fullscreen
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Recall Phase – Refined without Flagging
    if (phase === 'recall') {
        const currentQ = questions[currentIndex] || {};
        const answeredCount = Object.keys(answers).length;
        const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                {/* Header */}
                <div className="bg-white shadow px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <h1 className="font-semibold text-lg">Memory Test - Fase Menjawab</h1>
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-mono text-lg">
                        {formatTime(recallTimeLeft)}
                    </div>
                </div>

                {/* Question Navigation – wrap‑able grid (removed flag logic) */}
                <div className="bg-white border-b px-4 py-3">
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {questions.map((q, idx) => {
                            let btnClass = 'w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors ';

                            if (answers[q.id]) {
                                btnClass += 'bg-green-500 text-white hover:bg-green-600';
                            } else {
                                btnClass += 'bg-gray-200 text-gray-700 hover:bg-gray-300';
                            }

                            if (idx === currentIndex) {
                                btnClass += ' ring-2 ring-blue-500 ring-offset-2';
                            }
                            return (
                                <button key={q.id} onClick={() => goToQuestion(idx)} className={btnClass}>
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-2">
                    <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Main Question Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                            {/* Question Header */}
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-sm text-gray-500">
                                    Pertanyaan {currentIndex + 1} dari {questions.length}
                                </span>
                            </div>

                            {/* Question Text */}
                            <h2 className="text-xl font-medium text-gray-800 mb-8 leading-relaxed">
                                {currentQ.content}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3">
                                {currentQ.options?.map(opt => {
                                    const isSelected = answers[currentQ.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelect(opt.id)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition ${isSelected
                                                ? 'bg-blue-500 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                        >
                                            <span className={`font-bold mr-3 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                                {opt.label}.
                                            </span>
                                            <span>{opt.content}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className={`px-4 py-2 rounded-md font-medium transition ${currentIndex === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        ← Sebelumnya
                    </button>
                    <span className="text-sm text-gray-600 font-mono">
                        {answeredCount} / {questions.length}
                    </span>
                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="px-5 py-2 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 shadow-sm transition"
                        >
                            Selesai
                        </button>
                    ) : (
                        <button
                            onClick={goNext}
                            className="px-5 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 shadow-sm transition"
                        >
                            Selanjutnya →
                        </button>
                    )}
                </div>

                {/* Confirmation Modal */}
                {showConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100">
                            <h3 className="text-2xl font-bold mb-4 text-gray-800">Selesaikan Tes?</h3>
                            <p className="mb-6 text-gray-600">Anda telah menjawab {Object.keys(answers).length} dari {questions.length} pertanyaan.</p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirm(false);
                                        handleSubmit();
                                    }}
                                    disabled={isSubmitting}
                                    className={`px-5 py-2.5 text-white rounded-lg shadow-sm transition ${isSubmitting
                                            ? 'bg-blue-400 cursor-wait'
                                            : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fullscreen overlay */}
                {!isFullscreen && !isLocked && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white pointer-events-auto">
                        <h2 className="text-2xl font-bold mb-4">Paused</h2>
                        <p>Please return to fullscreen mode.</p>
                        <button
                            onClick={() => enterFullscreen()}
                            className="mt-4 px-6 py-2 bg-blue-500 rounded font-bold hover:bg-blue-600 transition"
                        >
                            Return to Fullscreen
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Fallback
    return <div>Loading...</div>;
}

export default MemoryTest;