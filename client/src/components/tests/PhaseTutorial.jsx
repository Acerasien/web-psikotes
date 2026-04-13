// client/src/components/tests/PhaseTutorial.jsx
import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';

/**
 * Phase Tutorial — Practice questions with feedback before timed assessment.
 * Supports both single-answer and multi-answer practice questions.
 */
export function PhaseTutorial({ phase, assignmentId, onReturnToHub, onStartTest, isLocked }) {
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState([]); // Array of selected option indices
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const practiceQuestions = phase.practice_questions || [];

  const pq = practiceQuestions[currentPracticeIndex];
  const isInstructionSlide = pq?.is_instruction && (!pq.options || pq.options.length === 0);
  const isMultiPractice = pq && !isInstructionSlide && Array.isArray(pq.correct_index);

  const handleNextInstruction = useCallback(() => {
    if (currentPracticeIndex < practiceQuestions.length - 1) {
      setCurrentPracticeIndex(prev => prev + 1);
      setPracticeAnswers([]);
      setShowFeedback(false);
    } else {
      onStartTest(phase);
    }
  }, [currentPracticeIndex, practiceQuestions.length, phase, onStartTest]);

  const handleSelectPractice = useCallback((optionIndex) => {
    if (showFeedback) return;

    if (isMultiPractice) {
      setPracticeAnswers(prev => {
        if (prev.includes(optionIndex)) return prev.filter(i => i !== optionIndex);
        if (prev.length >= 2) return prev;
        return [...prev, optionIndex];
      });
    } else {
      setPracticeAnswers([optionIndex]);
    }
  }, [showFeedback, isMultiPractice]);

  const handleCheckAnswer = useCallback(() => {
    if (practiceAnswers.length === 0) return;

    const pq2 = practiceQuestions[currentPracticeIndex];
    const correctIdx = Array.isArray(pq2.correct_index) ? pq2.correct_index : [pq2.correct_index];
    const ok = JSON.stringify([...practiceAnswers].sort()) === JSON.stringify([...correctIdx].sort());

    setIsCorrect(ok);
    setShowFeedback(true);
  }, [practiceAnswers, currentPracticeIndex, practiceQuestions]);

  const handleNextPractice = useCallback(() => {
    if (currentPracticeIndex < practiceQuestions.length - 1) {
      setCurrentPracticeIndex(prev => prev + 1);
      setPracticeAnswers([]);
      setShowFeedback(false);
    } else {
      Swal.fire({
        title: 'Latihan Selesai',
        text: 'Siap untuk memulai fase ini?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Mulai',
        cancelButtonText: 'Kembali',
      }).then((result) => {
        if (result.isConfirmed) {
          onStartTest(phase);
        }
      });
    }
  }, [currentPracticeIndex, practiceQuestions.length, phase, onStartTest]);

  const handleSkipToTest = useCallback(() => {
    onStartTest(phase);
  }, [phase, onStartTest]);

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center text-white p-4 z-50">
        <h2 className="text-2xl font-bold mb-4">Tes Terkunci</h2>
        <p className="mb-6 text-gray-300 text-center text-sm">Anda terlalu sering keluar dari mode layar penuh.</p>
        <button onClick={onReturnToHub} className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition min-h-[48px]">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  if (practiceQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold mb-2">Fase {phase.order_number}</h2>
        <p className="text-gray-500 mb-6">Tidak ada soal latihan.</p>
        <button
          onClick={handleSkipToTest}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition min-h-[48px]"
        >
          Mulai Fase
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Fase {phase.order_number} — Latihan</p>
          <p className="font-semibold">Soal {currentPracticeIndex + 1}/{practiceQuestions.length}</p>
        </div>
        <button
          onClick={onReturnToHub}
          className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition min-h-[44px]"
        >
          Kembali
        </button>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-200 h-1.5">
        <div
          className="bg-gray-400 h-1.5 transition-all"
          style={{ width: `${((currentPracticeIndex + 1) / practiceQuestions.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-2xl">
          {/* Instruction slide — no options, just info text + Lanjut button */}
          {isInstructionSlide ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Fase {phase.order_number} — Petunjuk
                </h3>
                <p
                  className="text-gray-700 leading-relaxed text-base text-justify"
                  dangerouslySetInnerHTML={{ __html: pq.content }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleNextInstruction}
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition min-h-[44px]"
                >
                  Paham
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Multi indicator */}
              {isMultiPractice && (
                <p className="text-sm text-blue-600 font-medium mb-3">
                  (Pilih {pq.correct_index.length} jawaban)
                </p>
              )}

              {/* Question */}
              <div
                className="text-base sm:text-lg font-semibold mb-6 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pq.content }}
              />

              {/* Options */}
              <div className="space-y-3">
                {pq.options.map((optContent, optIdx) => {
                  const isSelected = practiceAnswers.includes(optIdx);
                  let cls = 'w-full text-left px-4 py-3.5 border-2 rounded-lg transition-all min-h-[48px] flex items-center ';

                  if (showFeedback) {
                    const correctIdxs = Array.isArray(pq.correct_index) ? pq.correct_index : [pq.correct_index];
                    if (correctIdxs.includes(optIdx)) {
                      cls += 'bg-green-100 text-green-700 border-green-400 ';
                    } else if (isSelected && !correctIdxs.includes(optIdx)) {
                      cls += 'bg-red-100 text-red-700 border-red-400 ';
                    } else {
                      cls += 'bg-white text-gray-400 border-gray-200 ';
                    }
                  } else if (isSelected) {
                    cls += 'bg-blue-500 text-white border-blue-600 shadow-md ';
                  } else {
                    cls += 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 ';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectPractice(optIdx)}
                      className={cls}
                      disabled={showFeedback}
                    >
                      <span className="font-bold mr-3 flex-shrink-0 w-6">{String.fromCharCode(65 + optIdx)}.</span>
                      <span className="flex-1" dangerouslySetInnerHTML={{ __html: optContent }} />
                      {showFeedback && (() => {
                        const correctIdxs = Array.isArray(pq.correct_index) ? pq.correct_index : [pq.correct_index];
                        if (correctIdxs.includes(optIdx)) {
                          return <span className="ml-2 text-green-600 flex-shrink-0">✓</span>;
                        }
                        if (isSelected && !correctIdxs.includes(optIdx)) {
                          return <span className="ml-2 text-red-600 flex-shrink-0">✗</span>;
                        }
                        return null;
                      })()}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {isCorrect ? '✓ Benar!' : `✗ Salah. ${pq.explanation || 'Perhatikan baik-baik.'}`}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      {!isInstructionSlide && (
        <div className="bg-white border-t px-4 py-3 flex justify-end">
          {!showFeedback ? (
            <button
              onClick={handleCheckAnswer}
              disabled={practiceAnswers.length === 0}
              className={`px-6 py-2.5 rounded-lg font-semibold transition min-h-[44px] ${
                practiceAnswers.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Periksa
            </button>
          ) : (
            <button
              onClick={handleNextPractice}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition min-h-[44px]"
            >
              {currentPracticeIndex < practiceQuestions.length - 1 ? 'Selanjutnya' : 'Mulai Fase'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PhaseTutorial;
