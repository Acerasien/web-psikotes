// client/src/components/DISCTest.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useFullscreenLock } from '../hooks/useFullscreenLock';

function DISCTest({ token, assignmentId, onFinish }) {
    const [testData, setTestData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { isLocked, isFullscreen, enterFullscreen } = useFullscreenLock({
        assignmentId,
        token,
        onLock: () => setLoading(false)
    });

    // Load test data
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
                enterFullscreen();
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403 && err.response.data.detail.includes("locked")) {
                    // already locked
                }
                onFinish();
            }
        };
        loadTest();
    }, [assignmentId, token, enterFullscreen, onFinish]);

    // Timer effect
    useEffect(() => {
        if (timeLeft === null || loading || isLocked) return;
        if (timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerId);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [timeLeft, loading, isLocked]);

    const handleDiscRadio = (questionId, optionId, type) => {
        setAnswers(prev => {
            const currentQ = prev[questionId] || { most: null, least: null };
            let newMost = currentQ.most;
            let newLeast = currentQ.least;

            if (type === 'most') {
                newMost = optionId;
                if (newLeast === optionId) newLeast = null;
            } else {
                newLeast = optionId;
                if (newMost === optionId) newMost = null;
            }
            return { ...prev, [questionId]: { most: newMost, least: newLeast } };
        });
    };

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

    const handleSubmit = async (isTimeout = false) => {
        setIsSubmitting(true);
        const timeTaken = testData.time_limit === 0 ? 0 : testData.time_limit - timeLeft;
        try {
            const finalAnswers = formatDiscPayload(answers);
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

    const checkAllAnswered = () => {
        let missing = [];
        testData?.questions.forEach((q, idx) => {
            if (!answers[q.id]?.most || !answers[q.id]?.least) {
                missing.push(idx + 1);
            }
        });
        if (missing.length > 0) {
            Swal.fire({
                title: "Belum Lengkap",
                html: `Anda belum mengisi pertanyaan nomor: <strong>${missing.join(", ")}</strong>`,
                icon: "warning"
            });
            return false;
        }
        return true;
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
                <button onClick={onFinish} className="mt-6 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-center">Loading Test...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header with timer */}
            <div className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="font-bold text-lg">{testData?.test_name}</h1>
                <div className="text-xl font-mono bg-red-100 text-red-700 px-3 py-1 rounded">
                    {timeLeft !== null ? formatTime(timeLeft) : "Unlimited Time"}
                </div>
            </div>

            {/* DISC Table (same as before) */}
            <div className="flex-1 p-8 overflow-auto">
                <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6 mx-auto">
                    <h2 className="text-xl font-bold mb-4 text-center">
                        Pilih yang PALING SESUAI (P) dan PALING TIDAK SESUAI (K)
                    </h2>
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
                                {testData?.questions.map((q, qIdx) => (
                                    <React.Fragment key={q.id}>
                                        {q.options.map((opt, optIdx) => {
                                            const isMost = answers[q.id]?.most === opt.id;
                                            const isLeast = answers[q.id]?.least === opt.id;
                                            let rowClass = "hover:bg-gray-50";
                                            if (isMost) rowClass = "bg-green-100 border-green-300";
                                            if (isLeast) rowClass = "bg-red-100 border-red-300";
                                            return (
                                                <tr key={opt.id} className={rowClass}>
                                                    <td className="border p-3 text-center text-gray-500 font-bold">
                                                        {optIdx === 0 ? qIdx + 1 : ""}
                                                    </td>
                                                    <td className="border p-3">{opt.content}</td>
                                                    <td
                                                        className="border p-3 text-center cursor-pointer select-none"
                                                        onClick={() => handleDiscRadio(q.id, opt.id, 'most')}
                                                    >
                                                        <div className={`w-6 h-6 mx-auto rounded border-2 flex items-center justify-center ${isMost ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'
                                                            }`}>
                                                            {isMost && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="border p-3 text-center cursor-pointer select-none"
                                                        onClick={() => handleDiscRadio(q.id, opt.id, 'least')}
                                                    >
                                                        <div className={`w-6 h-6 mx-auto rounded border-2 flex items-center justify-center ${isLeast ? 'bg-red-500 border-red-600' : 'bg-white border-gray-300'
                                                            }`}>
                                                            {isLeast && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {qIdx < testData.questions.length - 1 && (
                                            <tr><td colSpan="4" className="border-b-4 border-gray-200"></td></tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                if (checkAllAnswered()) setShowConfirmModal(true);
                            }}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-8 rounded text-lg"
                        >
                            Selesai & Kirim
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                        <h3 className="text-xl font-bold mb-4">Submit Test?</h3>
                        <p className="mb-6 text-gray-600">
                            You have answered {Object.keys(answers).length} questions.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-200 rounded" disabled={isSubmitting}>Cancel</button>
                            <button onClick={() => handleSubmit()} disabled={isSubmitting} className={`px-4 py-2 text-white rounded font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}>
                                {isSubmitting ? "Submitting..." : "Submit Now"}
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
                    <button onClick={enterFullscreen} className="mt-4 px-4 py-2 bg-blue-500 rounded font-bold hover:bg-blue-600">
                        Return to Fullscreen
                    </button>
                </div>
            )}
        </div>
    );
}

export default DISCTest;