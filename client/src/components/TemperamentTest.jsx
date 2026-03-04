// client/src/components/TemperamentTest.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function TemperamentTest({ token, assignmentId, onFinish }) {
    const [testData, setTestData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Integrity state
    const [exitCount, setExitCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true);

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    };

    useEffect(() => {
        const loadTest = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/assignments/${assignmentId}/start`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestData(res.data);
                setLoading(false);
                enterFullscreen(); // Enter fullscreen after load
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403 && err.response.data.detail.includes("locked")) {
                    setIsLocked(true);
                    setLoading(false);
                } else {
                    onFinish();
                }
            }
        };
        loadTest();
    }, [token, assignmentId]);

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = document.fullscreenElement !== null;
            if (!isCurrentlyFullscreen && !isLocked && !loading) {
                const newCount = exitCount + 1;
                setExitCount(newCount);

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
    }, [exitCount, isLocked, loading, assignmentId, token]);

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

    // Auto‑next after answer selection
    useEffect(() => {
        if (isLocked || loading) return;
        // Check if we just answered the current question and auto‑next should trigger
        // We'll rely on a flag or simply after setting answers, we move.
        // This effect runs when answers changes, but we need to know if it was a new answer.
        // We'll use a ref to track if auto‑next is pending.
        // Simpler: handle auto‑next inside handleSelect with setTimeout.
    }, []); // We'll implement inside handleSelect

    const handleSelect = (optionId) => {
        if (isLocked) return;
        const qId = testData.questions[currentIndex].id;
        setAnswers(prev => ({ ...prev, [qId]: optionId }));

        // Auto‑next after 200ms (if not last question)
        setTimeout(() => {
            if (currentIndex < testData.questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setShowConfirm(true);
            }
        }, 200);
    };

    const goNext = () => {
        if (currentIndex < testData.questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = async () => {
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < testData.questions.length) {
            Swal.fire({
                title: 'Belum Lengkap',
                text: `Anda baru menjawab ${answeredCount} dari ${testData.questions.length} pertanyaan.`,
                icon: 'warning'
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
                time_taken: 0
            };
            await axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/submit`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire({
                title: 'Tes Selesai',
                text: 'Jawaban Anda telah disimpan.',
                icon: 'success'
            }).then(() => onFinish());
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal mengirim jawaban.', 'error');
            setIsSubmitting(false);
        }
    };

    if (isLocked) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
                <h2 className="text-3xl font-bold mb-4">Test Locked</h2>
                <p className="mb-2">You have exited fullscreen too many times.</p>
                <button onClick={onFinish} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const currentQ = testData.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / testData.questions.length * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="font-bold text-lg">{testData.test_name}</h1>
                <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">
                    {answeredCount} / {testData.questions.length} terjawab
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-2">
                <div className="bg-blue-500 h-2 transition-all" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Question area */}
            <div className="flex-1 p-8 flex flex-col items-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
                    <p className="text-sm text-gray-500 mb-2">Pertanyaan {currentIndex + 1}</p>
                    <h2 className="text-xl font-semibold mb-6">{currentQ.content}</h2>

                    <div className="space-y-3">
                        {currentQ.options.map((opt) => (
                            <label
                                key={opt.id}
                                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${answers[currentQ.id] === opt.id
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`q${currentQ.id}`}
                                    value={opt.id}
                                    checked={answers[currentQ.id] === opt.id}
                                    onChange={() => handleSelect(opt.id)}
                                    className="mr-3"
                                    disabled={isLocked}
                                />
                                <span>{opt.label}. {opt.content}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation footer */}
            <div className="bg-white p-4 shadow flex justify-between">
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0 || isLocked}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Sebelumnya
                </button>
                {currentIndex === testData.questions.length - 1 ? (
                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={isLocked}
                        className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:opacity-50"
                    >
                        Selesai
                    </button>
                ) : (
                    <button
                        onClick={goNext}
                        disabled={isLocked}
                        className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 disabled:opacity-50"
                    >
                        Selanjutnya
                    </button>
                )}
            </div>

            {/* Confirmation modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                        <h3 className="text-xl font-bold mb-4">Selesaikan Tes?</h3>
                        <p className="mb-6 text-gray-600">
                            Anda telah menjawab {answeredCount} pertanyaan.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-gray-200 rounded">
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-white rounded font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen overlay */}
            {!isFullscreen && !isLocked && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
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

export default TemperamentTest;