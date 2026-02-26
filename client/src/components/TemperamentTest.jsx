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

    useEffect(() => {
        const loadTest = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/assignments/${assignmentId}/start`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                onFinish();
            }
        };
        loadTest();
    }, [token, assignmentId]);

    const handleSelect = (optionId) => {
        const qId = testData.questions[currentIndex].id;
        setAnswers({ ...answers, [qId]: optionId });
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
        // Check if all questions answered
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
                time_taken: 0  // no timer
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const currentQ = testData.questions[currentIndex];
    const progress = ((Object.keys(answers).length) / testData.questions.length * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header with progress */}
            <div className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="font-bold text-lg">{testData.test_name}</h1>
                <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">
                    {Object.keys(answers).length} / {testData.questions.length} terjawab
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
                                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${answers[currentQ.id] === opt.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`q${currentQ.id}`}
                                    value={opt.id}
                                    checked={answers[currentQ.id] === opt.id}
                                    onChange={() => handleSelect(opt.id)}
                                    className="mr-3"
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
                    disabled={currentIndex === 0}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Sebelumnya
                </button>
                {currentIndex === testData.questions.length - 1 ? (
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600"
                    >
                        Selesai
                    </button>
                ) : (
                    <button
                        onClick={goNext}
                        className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
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
                            Anda telah menjawab {Object.keys(answers).length} pertanyaan.
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
        </div>
    );
}

export default TemperamentTest;