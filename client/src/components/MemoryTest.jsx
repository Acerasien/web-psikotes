// client/src/components/MemoryTest.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../hooks/useTestSession';
import Swal from 'sweetalert2';

function MemoryTest({ assignmentId }) {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('encoding');
    const [encodingTimeLeft, setEncodingTimeLeft] = useState(0);
    const [recallTimeLeft, setRecallTimeLeft] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [justAnswered, setJustAnswered] = useState(false);

    const handleTestComplete = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    // Check if fullscreen is supported (for UI messaging)
    const isFullscreenSupported = !!(
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen ||
        document.documentElement.msRequestFullscreen
    );

    const {
        testData,
        questions,
        answers,
        setAnswers,
        timeLeft,
        loading,
        isSubmitting: hookIsSubmitting,
        showConfirmModal,
        setShowConfirmModal,
        isLocked,
        isFullscreen,
        enterFullscreen,
        handleSubmit,
        formatTime,
        syncAnswer,
    } = useTestSession(assignmentId, {
        requireAllAnswers: false, // Memory test has its own validation
        onTestComplete: handleTestComplete,
        disableTimer: true // Memory test uses custom encoding/recall timers
    });

    // Refs to hold latest values for stable callbacks
    const answersRef = useRef(answers);
    const testDataRef = useRef(testData);
    const recallTimeLeftRef = useRef(recallTimeLeft);
    const questionsRef = useRef(questions);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        testDataRef.current = testData;
    }, [testData]);

    useEffect(() => {
        recallTimeLeftRef.current = recallTimeLeft;
    }, [recallTimeLeft]);

    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);

    const toggleFlag = useCallback(() => {
        // Disabled - no flagging in auto-next tests
    }, []);

    // Handle answer selection with auto-advance and visual feedback
    const handleSelect = useCallback((optionId) => {
        const qId = questions[currentIndex]?.id;
        if (!qId) return;

        setAnswers(prev => ({ ...prev, [qId]: optionId }));
        syncAnswer(qId, optionId, 'single');
        setJustAnswered(true);

        // Auto-advance after delay to let user see their selection
        setTimeout(() => {
            setJustAnswered(false);
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // Last question - show confirm modal
                setShowConfirmModal(true);
            }
        }, 350);
    }, [questions, currentIndex, setAnswers]);

    // Navigation - forward only (no back navigation)
    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Set encoding and recall times when test data loads
    useEffect(() => {
        if (testData && !loading) {
            setEncodingTimeLeft(testData.settings?.encoding_time || 180);
            setRecallTimeLeft(testData.settings?.recall_time || 600);
        }
    }, [testData, loading]);

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

    // Timer state for submission prevention
    const isSubmittingRef = useRef(false);

    // Encoding timer
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

    // Recall timer (uses hook's handleSubmit)
    useEffect(() => {
        if (phase !== 'recall' || recallTimeLeft <= 0 || isLocked || isSubmittingRef.current) return;
        const timer = setInterval(() => {
            setRecallTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!isSubmittingRef.current) {
                        isSubmittingRef.current = true;
                        handleSubmit(true);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, recallTimeLeft, isLocked, handleSubmit]);

    // Handle confirm submission from global modal
    const handleConfirmSubmit = useCallback(() => {
        setShowConfirmModal(false);
        handleSubmit(false);
    }, [handleSubmit, setShowConfirmModal]);

    const getTableRows = (tableData) => {
        if (!tableData) return 0;
        let maxLength = 0;
        Object.values(tableData).forEach(arr => {
            if (arr && arr.length > maxLength) maxLength = arr.length;
        });
        return maxLength;
    };

    // Locked screen
    if (isLocked) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white">
                <h2 className="text-3xl font-bold mb-4">Tes Terkunci</h2>
                <p className="mb-2">Anda terlalu sering keluar dari mode layar penuh.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                    Kembali ke Dashboard
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

                <div className="flex-1 p-8 overflow-auto pb-24 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest">Tabel Hafalan</h2>
                        {tableData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 justify-center">
                                {Object.entries(tableData).map(([category, entries], catIdx) => {
                                    return (
                                        <div key={catIdx} className="flex justify-center">
                                            <table className="border-2 border-black border-collapse w-full max-w-[200px] bg-white shadow-sm">
                                                <thead>
                                                    <tr>
                                                        <th colSpan={2} className="border-2 border-black px-2 py-1 text-center font-black text-lg uppercase bg-white">
                                                            {category}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {entries.map((entry, entryIdx) => {
                                                        const lastSpace = entry.lastIndexOf(' ');
                                                        const name = lastSpace !== -1 ? entry.substring(0, lastSpace).trim() : entry;
                                                        const code = lastSpace !== -1 ? entry.substring(lastSpace + 1).trim() : '';
                                                        return (
                                                            <tr key={entryIdx}>
                                                                <td className="border-2 border-black px-3 py-1 text-center font-bold text-md uppercase w-1/2">
                                                                    {name}
                                                                </td>
                                                                <td className="border-2 border-black px-3 py-1 text-center font-bold text-md uppercase w-1/2">
                                                                    {code}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">Tidak ada data tabel tersedia.</p>
                        )}
                        <div className="mt-12 p-4 bg-white rounded-lg border border-gray-200 shadow-sm max-w-2xl mx-auto">
                            <p className="text-center text-gray-700 font-medium">
                                Hafalkan tabel di atas. Anda akan diberikan <span className="text-blue-600 font-bold">{questions.length}</span> pertanyaan setelah waktu habis.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fullscreen overlay - Only show if fullscreen is supported */}
                {!isFullscreen && !isLocked && isFullscreenSupported && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-40 text-white">
                        <h2 className="text-2xl font-bold mb-4">Dijeda</h2>
                        <p>Harap kembali ke mode layar penuh.</p>
                        <button
                            onClick={() => enterFullscreen()}
                            className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold hover:bg-blue-600"
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

    // --- Recall Phase ---
    const currentQ = questions[currentIndex] || {};
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="font-bold text-lg">Memory Test - Fase Menjawab</h1>
                <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
                    {formatTime(recallTimeLeft)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-2">
                <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Main Question Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    <div className={`bg-white rounded-xl shadow-md p-6 md:p-8 transition-all duration-300 ${
                        justAnswered ? 'scale-[1.02] shadow-xl' : ''
                    }`}>
                        {/* Question Header */}
                        <div className="flex justify-between items-center mb-6">
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

            {/* Footer Navigation - Forward only */}
            <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
                <div></div> {/* Empty div for spacing */}
                <span className="text-sm text-gray-600 font-mono">
                    {answeredCount} / {questions.length}
                </span>
                {currentIndex === questions.length - 1 ? (
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        className="px-5 py-3 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 shadow-sm transition min-h-[44px]"
                    >
                        Selesai
                    </button>
                ) : (
                    <button
                        onClick={goNext}
                        className="px-5 py-3 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 shadow-sm transition min-h-[44px]"
                    >
                        Selanjutnya →
                    </button>
                )}
            </div>

            {/* Standard Confirmation Modal Wrapper (Legacy fix) */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Selesaikan Tes?</h3>
                        <p className="text-gray-600 mb-6">
                            Anda telah menjawab {answeredCount} dari {questions.length} pertanyaan.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition min-h-[44px]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                disabled={hookIsSubmitting}
                                className={`px-6 py-3 text-white rounded-lg shadow-md transition min-h-[44px] font-bold ${hookIsSubmitting
                                        ? 'bg-blue-400 cursor-wait'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {hookIsSubmitting ? 'Mengirim...' : 'Ya, Kirim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Overlay - Only show if fullscreen is supported */}
            {!isFullscreen && !isLocked && isFullscreenSupported && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-white">
                    <h2 className="text-2xl font-bold mb-4">Dijeda</h2>
                    <p className="mb-6 text-gray-200">Harap kembali ke mode layar penuh.</p>
                    <button
                        onClick={() => enterFullscreen()}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                    >
                        Kembali ke Layar Penuh
                    </button>
                </div>
            )}

            {/* Info banner for unsupported browsers (e.g., iOS Safari) */}
            {!isFullscreen && !isLocked && !isFullscreenSupported && (
                <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white p-3 text-center text-sm z-50">
                    ⚠️ Mode layar penuh tidak didukung di browser Anda. Harap jangan berpindah tab.
                </div>
            )}
        </div>
    );
}

export default MemoryTest;
