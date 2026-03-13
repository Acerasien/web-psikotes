import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { tutorials } from '../data/tutorials.jsx';

function Tutorial({ assignmentId, testCode, testName, onComplete }) {
    const { token } = useAuth();
    const tutorial = tutorials[testCode];
    const [currentSample, setCurrentSample] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    if (!tutorial) {
        onComplete();
        return null;
    }

    const sample = tutorial.samples[currentSample];

    const handleOptionClick = (option) => {
        if (option.next) {
            // Non‑interactive step – just move to next sample
            handleNext();
            return;
        }
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
                    await api.completeTutorial(assignmentId);
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
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{tutorial.title}</h2>
                <p className="text-gray-600 mb-6">{tutorial.instructions}</p>

                <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 mb-4">
                        Contoh {currentSample + 1} dari {tutorial.samples.length}
                    </p>

                    {/* Question / content */}
                    <div className="mb-6">
                        <p className="text-lg font-medium mb-2">{sample.question}</p>
                        {sample.content && typeof sample.content === 'string' ? (
                            <p className="text-gray-700">{sample.content}</p>
                        ) : (
                            sample.content // JSX
                        )}
                    </div>

                    {/* Options */}
                    {sample.options && sample.options.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {sample.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(opt)}
                                    disabled={showExplanation && !opt.next}
                                    className={`w-full text-left p-4 border rounded-lg transition ${selected === opt
                                        ? opt.correct
                                            ? 'bg-green-100 border-green-500'
                                            : 'bg-gray-200 border-gray-400'
                                        : 'bg-white hover:bg-gray-50'
                                        } ${opt.next ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium' : ''}`}
                                >
                                    <span className="font-bold mr-3">{opt.label}.</span>
                                    <span>{opt.content}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {showExplanation && sample.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">{sample.explanation}</p>
                        </div>
                    )}

                    {/* Only show next button if there is no interactive option or we need to advance after explanation */}
                    {showExplanation && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                {currentSample < tutorial.samples.length - 1 ? 'Lanjut' : 'Selesai Tutorial'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Tutorial;