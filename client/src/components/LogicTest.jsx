// client/src/components/LogicTest.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { useFullscreenLock } from '../hooks/useFullscreenLock';

function LogicTest({ assignmentId }) {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [testData, setTestData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [flagged, setFlagged] = useState(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [justAnswered, setJustAnswered] = useState(false);

    const { isLocked, isFullscreen, enterFullscreen } = useFullscreenLock({
        assignmentId,
        token
    });

    const toggleFlag = useCallback(() => {
        if (questions.length === 0) return;
        const qId = questions[currentIndex].id;
        setFlagged(prev => {
            const newSet = new Set(prev);
            if (newSet.has(qId)) newSet.delete(qId);
            else newSet.add(qId);
            return newSet;
        });
    }, [questions, currentIndex]);

    const handleSelect = (optionId) => {
        const qId = questions[currentIndex]?.id;
        if (!qId) return;
        setAnswers(prev => ({ ...prev, [qId]: optionId }));
        setJustAnswered(true);
        
        // Auto-advance after delay (but can still go back)
        setTimeout(() => {
            setJustAnswered(false);
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
        }, 350); // Increased delay for visual feedback
    };

    const goToQuestion = (index) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        }
    };

    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Load test data
    useEffect(() => {
        const loadTest = async () => {
            try {
                const res = await api.startTest(assignmentId);
                setTestData(res.data);
                setQuestions(res.data.questions);
                setTimeLeft(res.data.time_limit || 1800);
                setLoading(false);
                enterFullscreen();
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403 && err.response.data.detail.includes("locked")) {
                    setLoading(false);
                } else {
                    Swal.fire('Error', 'Gagal memuat tes.', 'error');
                    navigate('/dashboard');
                }
            }
        };
        loadTest();
    }, [assignmentId, enterFullscreen, navigate]);

    // Prevent context menu and dev tools
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

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || isLocked) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isLocked]);

    const handleSubmit = async (isTimeout = false) => {
        // Check if all questions answered
        const answeredCount = Object.keys(answers).length;
        if (!isTimeout && answeredCount < questions.length) {
            Swal.fire({
                title: 'Belum Lengkap',
                text: `Anda baru menjawab ${answeredCount} dari ${questions.length} pertanyaan. Silakan jawab semua pertanyaan sebelum menyelesaikan tes.`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                answers: Object.keys(answers).map(qId => ({
                    question_id: parseInt(qId),
                    option_id: answers[qId],
                    type: 'single'
                })),
                time_taken: (testData?.time_limit || 1800) - timeLeft
            };
            await api.submitTest(assignmentId, payload.answers, payload.time_taken);
            if (isTimeout) {
                Swal.fire('Waktu Habis', 'Tes telah dikirim otomatis.', 'info');
            } else {
                Swal.fire('Sukses', 'Jawaban Anda telah disimpan.', 'success');
            }
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal mengirim jawaban.', 'error');
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (isLocked) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
                <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
                <p className="mb-2">You have exited fullscreen too many times.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
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

    const currentQ = questions[currentIndex] || {};
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <h1 className="font-semibold text-lg">Logic & Arithmetic Test</h1>
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-mono text-lg">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Question Navigation Grid */}
            <div className="bg-white border-b px-4 py-3">
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {questions.map((q, idx) => {
                        let btnClass = 'w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors cursor-pointer ';
                        if (answers[q.id]) {
                            btnClass += 'bg-green-500 text-white hover:bg-green-600';
                        } else if (flagged.has(q.id)) {
                            btnClass += 'bg-yellow-400 text-white hover:bg-yellow-500';
                        } else {
                            btnClass += 'bg-gray-200 text-gray-700 hover:bg-gray-300';
                        }
                        if (idx === currentIndex) {
                            btnClass += ' ring-2 ring-blue-500 ring-offset-2';
                        }
                        return (
                            <button 
                                key={q.id} 
                                type="button"
                                onClick={() => goToQuestion(idx)} 
                                className={btnClass}
                            >
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

            {/* Question Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    <div className={`bg-white rounded-xl shadow-md p-6 md:p-8 transition-all duration-300 ${
                        justAnswered ? 'scale-[1.02] shadow-xl' : ''
                    }`}>
                        {/* Question Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <span className="text-sm text-gray-500">
                                Pertanyaan {currentIndex + 1} dari {questions.length}
                            </span>
                            <button
                                onClick={toggleFlag}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${flagged.has(currentQ.id)
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {flagged.has(currentQ.id) ? '⛳ Ditinggalkan' : 'Tandai'}
                            </button>
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
                                            } ${justAnswered && isSelected ? 'animate-pulse' : ''}`}
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
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-xl font-bold mb-3">Selesaikan Tes?</h3>
                        <p className="text-gray-600 mb-6">
                            Anda telah menjawab {answeredCount} dari {questions.length} pertanyaan.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    handleSubmit();
                                }}
                                disabled={isSubmitting}
                                className={`px-5 py-2 text-white rounded-lg shadow transition ${isSubmitting
                                        ? 'bg-blue-400 cursor-wait'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Overlay */}
            {!isFullscreen && !isLocked && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-white">
                    <h2 className="text-2xl font-bold mb-4">Paused</h2>
                    <p className="mb-6 text-gray-200">Please return to fullscreen mode.</p>
                    <button
                        onClick={() => enterFullscreen()}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                    >
                        Return to Fullscreen
                    </button>
                </div>
            )}
        </div>
    );
}

export default LogicTest;