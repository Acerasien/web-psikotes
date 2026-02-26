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

    // --- Load test data ---
    useEffect(() => {
        const loadTest = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/assignments/${assignmentId}/start`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestData(res.data);
                setQuestions(res.data.questions);
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
                    onFinish();
                }
            }
        };
        loadTest();
    }, [token, assignmentId]);

    // --- Fullscreen change listener ---
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = document.fullscreenElement !== null;
            if (!isCurrentlyFullscreen && !isLocked && !loading) {
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
    }, [exitCount, isLocked, loading, assignmentId, token]);

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

    const handleSelect = (optionId) => {
        const qId = questions[currentIndex].id;
        setAnswers({ ...answers, [qId]: optionId });
        // Auto-next after selection
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                setShowConfirm(true);
            }
        }, 200);
    };

    const handleSubmit = async (isTimeout = false) => {
        setIsSubmitting(true);
        try {
            const payload = {
                answers: Object.keys(answers).map(qId => ({
                    question_id: parseInt(qId),
                    option_id: answers[qId],
                    type: 'single'
                })),
                // Time taken in recall phase (or total? we'll use recall time taken)
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
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // --- Locked screen ---
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

    if (loading) return <div className="p-8 text-center">Loading tes...</div>;

    // --- Encoding Phase ---
    if (phase === 'encoding') {
        const tableData = testData.settings?.table_data;
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <div className="bg-white shadow p-4 flex justify-between items-center">
                    <h1 className="font-bold text-lg">Memory Test - Fase Menghafal</h1>
                    <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
                        {formatTime(encodingTimeLeft)}
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-auto">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold mb-4 text-center">Tabel Hafalan</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        {tableData && Object.keys(tableData).map(cat => (
                                            <th key={cat} className="border border-gray-300 px-4 py-2 text-sm font-semibold">
                                                {cat}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData && [...Array(5)].map((_, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {Object.keys(tableData).map(cat => {
                                                const items = tableData[cat];
                                                return (
                                                    <td key={cat} className="border border-gray-300 px-4 py-2 text-sm">
                                                        {items[rowIdx] || ''}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4 text-center text-gray-600">
                            Hafalkan tabel di atas. Anda akan diberikan 50 pertanyaan setelah waktu habis.
                        </p>
                    </div>
                </div>

                {/* Fullscreen overlay when not in fullscreen */}
                {!isFullscreen && !isLocked && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
                        <h2 className="text-2xl font-bold mb-4">Paused</h2>
                        <p>Please return to fullscreen mode.</p>
                        <button
                            onClick={() => enterFullscreen()}
                            className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold"
                        >
                            Return to Fullscreen
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- Recall Phase ---
    const currentQ = questions[currentIndex];
    const progress = ((Object.keys(answers).length) / questions.length * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="font-bold text-lg">Memory Test - Fase Menjawab</h1>
                <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
                    {formatTime(recallTimeLeft)}
                </div>
            </div>
            <div className="w-full bg-gray-200 h-2">
                <div className="bg-blue-500 h-2 transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
                    <p className="text-sm text-gray-500 mb-2">Pertanyaan {currentIndex + 1} dari {questions.length}</p>
                    <h2 className="text-xl font-semibold mb-6">{currentQ.content}</h2>
                    <div className="space-y-3">
                        {currentQ.options.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleSelect(opt.id)}
                                className={`w-full text-left p-4 border rounded-lg transition ${answers[currentQ.id] === opt.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold mr-2">{opt.label}.</span> {opt.content}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full text-center">
                        <h3 className="text-xl font-bold mb-4">Selesaikan Tes?</h3>
                        <p className="mb-6">Anda telah menjawab {Object.keys(answers).length} pertanyaan.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-gray-200 rounded">
                                Batal
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-white rounded ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen overlay during recall phase */}
            {!isFullscreen && !isLocked && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
                    <h2 className="text-2xl font-bold mb-4">Paused</h2>
                    <p>Please return to fullscreen mode.</p>
                    <button
                        onClick={() => enterFullscreen()}
                        className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold"
                    >
                        Return to Fullscreen
                    </button>
                </div>
            )}
        </div>
    );
}

export default MemoryTest;