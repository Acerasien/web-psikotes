import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { tutorials } from '../data/tutorials';

function Tutorial({ token, assignmentId, testCode, testName, onComplete }) {
    const tutorial = tutorials[testCode];
    const [currentSample, setCurrentSample] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    if (!tutorial) {
        // fallback: if no tutorial defined, just start test
        onComplete();
        return null;
    }

    const sample = tutorial.samples[currentSample];

    const handleOptionClick = (option) => {
        setSelected(option);
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentSample < tutorial.samples.length - 1) {
            setCurrentSample(currentSample + 1);
            setSelected(null);
            setShowExplanation(false);
        } else {
            // All samples done – mark tutorial as completed
            Swal.fire({
                title: 'Siap Memulai?',
                text: 'Anda telah menyelesaikan tutorial. Tes sesungguhnya akan segera dimulai.',
                icon: 'question',
                confirmButtonText: 'Mulai Tes'
            }).then(async () => {
                try {
                    await axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/complete-tutorial`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    onComplete();
                } catch (err) {
                    console.error(err);
                    Swal.fire('Error', 'Gagal menyimpan progres tutorial.', 'error');
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{tutorial.title}</h2>
                <p className="text-gray-600 mb-6">{tutorial.instructions}</p>

                <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 mb-4">Contoh {currentSample + 1} dari {tutorial.samples.length}</p>
                    <p className="text-lg font-medium mb-4">{sample.question}</p>

                    <div className="space-y-3 mb-6">
                        {sample.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionClick(opt)}
                                disabled={showExplanation}
                                className={`w-full text-left p-4 border rounded-lg transition ${selected === opt
                                    ? opt.correct
                                        ? 'bg-green-100 border-green-500'
                                        : 'bg-red-100 border-red-500'
                                    : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold mr-3">{opt.label}.</span>
                                <span>{opt.content}</span>
                            </button>
                        ))}
                    </div>

                    {showExplanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">{sample.explanation}</p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        {showExplanation && (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                {currentSample < tutorial.samples.length - 1 ? 'Lanjut' : 'Selesai Tutorial'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Tutorial;