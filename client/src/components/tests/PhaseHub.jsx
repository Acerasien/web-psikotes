// client/src/components/tests/PhaseHub.jsx
import { useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';

/**
 * Phase Hub — Phase list with status indicators.
 * White/light theme matching the rest of the website.
 */
export function PhaseHub({
  phases,
  testTitle,
  onStartTutorial,
  onSubmitAll,
  isSubmitting,
  showConfirmModal,
  setShowConfirmModal,
  isLocked,
}) {
  const completedCount = useMemo(() => phases.filter(p => p.status === 'done').length, [phases]);
  const allDone = completedCount === phases.length;

  const handleSubmitAll = useCallback(() => {
    setShowConfirmModal(true);
  }, [setShowConfirmModal]);

  const handleConfirmSubmit = useCallback(() => {
    onSubmitAll();
  }, [onSubmitAll]);

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center text-white p-4 z-50">
        <h2 className="text-2xl font-bold mb-4 text-center">Tes Terkunci</h2>
        <p className="mb-6 text-gray-300 text-center text-sm">
          Anda terlalu sering keluar dari mode layar penuh.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition min-h-[48px]"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">{testTitle}</h1>
            <p className="text-sm text-gray-500">{phases.length} fase • Selesaikan setiap fase untuk membuka fase berikutnya</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{completedCount}/{phases.length}</span>
            <div>selesai</div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-blue-500 h-2 transition-all duration-500"
          style={{ width: `${phases.length > 0 ? (completedCount / phases.length) * 100 : 0}%` }}
        />
      </div>

      {/* Phase List */}
      <div className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              onStartTutorial={() => onStartTutorial(phase)}
            />
          ))}
        </div>
      </div>

      {/* Submit All */}
      {allDone && (
        <div className="bg-white border-t px-4 sm:px-6 py-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-gray-600 mb-3">Semua fase selesai. Kirim tes Anda sekarang?</p>
            <button
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className={`px-8 py-3 text-white rounded-lg font-semibold transition min-h-[48px] ${
                isSubmitting
                  ? 'bg-gray-400 cursor-wait'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Semua'}
            </button>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-3">Kirim Semua Jawaban?</h3>
            <p className="text-gray-600 mb-6">
              Semua {phases.length} fase telah selesai. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition min-h-[44px]"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition min-h-[44px]"
                disabled={isSubmitting}
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

/**
 * Individual phase card in the hub.
 */
export function PhaseCard({ phase, onStartTutorial }) {
  const isDone = phase.status === 'done';
  const isLocked = phase.status === 'locked';
  const isCurrent = phase.status === 'current';

  let cardClass = 'bg-white rounded-lg shadow-sm p-4 flex items-center justify-between transition ';
  if (isDone) cardClass += 'border-l-4 border-green-500 ';
  else if (isLocked) cardClass += 'border-l-4 border-gray-300 opacity-60 ';
  else if (isCurrent) cardClass += 'border-l-4 border-blue-500 ring-1 ring-blue-200';

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          isDone
            ? 'bg-green-100 text-green-600'
            : isLocked
              ? 'bg-gray-100 text-gray-400'
              : 'bg-blue-100 text-blue-600'
        }`}>
          {isDone ? '✓' : isLocked ? '🔒' : phase.order_number}
        </div>

        <div>
          <h3 className="font-semibold">Phase {phase.order_number}</h3>
          <p className="text-sm text-gray-500">
            {isDone
              ? `${phase.answered_count}/${phase.total_questions} benar`
              : isLocked
                ? 'Terkunci'
                : `${phase.timer_seconds}s • ${phase.total_questions} soal`}
          </p>
        </div>
      </div>

      <div>
        {isDone ? (
          <span className="text-green-600 font-medium text-sm">Selesai</span>
        ) : isLocked ? (
          <span className="text-gray-400 text-sm">—</span>
        ) : (
          <button
            onClick={onStartTutorial}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition min-h-[44px]"
          >
            Mulai
          </button>
        )}
      </div>
    </div>
  );
}

export default PhaseHub;
