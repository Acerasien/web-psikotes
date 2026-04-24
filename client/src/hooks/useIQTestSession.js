// client/src/hooks/useIQTestSession.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { useFullscreenLock } from './useFullscreenLock';

/**
 * Session hook for phase-based IQ tests.
 * Manages per-phase session persistence and phase hub state.
 */
export function useIQTestSession(assignmentId) {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Test state
  const [testData, setTestData] = useState(null);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Per-phase session storage
  const sessionKey = (phaseId) => `iq_phase_${phaseId}_answers`;
  const hubKey = `iq_phase_hub_progress`;

  // Fullscreen lock (same as other tests)
  const { isLocked, isFullscreen, enterFullscreen, exitCount } = useFullscreenLock({
    assignmentId,
    token
  });

  // Load phases
  const loadPhases = useCallback(async () => {
    try {
      const res = await api.get(`/assignments/${assignmentId}/phases`);
      setPhases(res.data);

      // Load test metadata once
      if (!testData) {
        const testRes = await api.startTest(assignmentId);
        setTestData(testRes.data);
        enterFullscreen();
      }

      setLoading(false);
    } catch (err) {
      console.error('Gagal memuat fase:', err);
      setLoading(false);
      if (err.response?.status === 403 && err.response.data.detail.includes('locked')) {
        Swal.fire('Tes Terkunci', 'Anda terlalu sering keluar dari mode layar penuh.', 'error');
      } else {
        Swal.fire('Kesalahan', 'Gagal memuat tes IQ. Harap coba lagi.', 'error');
      }
      navigate('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, enterFullscreen, navigate]);

  // Initial load only
  useEffect(() => {
    loadPhases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent context menu and dev tools
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j'].includes(e.key)) ||
          (e.ctrlKey && ['U', 'u'].includes(e.key))) {
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

  // Prevent browser back button and tab navigation during test
  const disableBackButtonPrevention = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Anda sedang dalam pengerjaan tes. Yakin ingin keluar?';
      return e.returnValue;
    };

    // Push a state to the history stack to intercept back button
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Push the state again to prevent navigation
      window.history.pushState(null, '', window.location.href);

      // Show warning
      Swal.fire({
        title: 'Tidak Bisa Kembali',
        text: 'Anda tidak dapat meninggalkan halaman ini saat tes sedang berlangsung.',
        icon: 'warning',
        confirmButtonText: 'OK',
        allowOutsideClick: false,
        confirmButtonColor: '#0F172A',
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Store cleanup function for manual invocation
    disableBackButtonPrevention.current = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };

    return () => {
      if (disableBackButtonPrevention.current) {
        disableBackButtonPrevention.current();
      }
    };
  }, []);

  // Phase session helpers
  const getPhaseAnswers = (phaseId) => {
    try {
      const stored = localStorage.getItem(sessionKey(phaseId));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setPhaseAnswers = (phaseId, answers) => {
    localStorage.setItem(sessionKey(phaseId), JSON.stringify(answers));
  };

  const clearPhaseSession = (phaseId) => {
    localStorage.removeItem(sessionKey(phaseId));
  };

  const getHubProgress = () => {
    try {
      const stored = localStorage.getItem(hubKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setHubProgress = (donePhaseIds) => {
    localStorage.setItem(hubKey, JSON.stringify(donePhaseIds));
  };

  // Submit phase
  const submitPhase = useCallback(async (phaseId, answers) => {
    setIsSubmitting(true);
    try {
      await api.post(`/assignments/${assignmentId}/submit-phase`, {
        phase_id: phaseId,
        answers,
      });
      clearPhaseSession(phaseId);
      await loadPhases(); // Refresh phase statuses
    } catch (err) {
      console.error('Failed to submit phase:', err);
      Swal.fire('Kesalahan', 'Gagal mengirim fase. Harap coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [assignmentId, loadPhases]);

  // Sync individual answer
  const syncAnswer = useCallback(async (questionId, optionId, type = 'single') => {
    try {
      await api.saveAnswer(assignmentId, questionId, optionId, type);
    } catch (err) {
      console.warn('Failed to sync answer:', err);
    }
  }, [assignmentId]);

  // Timer state for submission prevention
  const isSubmittingRef = useRef(false);

  // Submit all phases
  const submitAll = useCallback(async () => {
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Get device info
      const ua = navigator.userAgent;
      let deviceType = "Desktop";
      if (/Android/i.test(ua)) deviceType = "Android";
      else if (/iPhone|iPad|iPod/i.test(ua)) deviceType = "iOS";
      
      let browserName = "Unknown Browser";
      if (ua.indexOf("Chrome") > -1) browserName = "Chrome";
      else if (ua.indexOf("Safari") > -1) browserName = "Safari";
      else if (ua.indexOf("Firefox") > -1) browserName = "Firefox";
      else if (ua.indexOf("MSIE") > -1 || !!document.documentMode === true) browserName = "IE";
      
      const deviceInfo = `${deviceType} (${browserName})`;

      const res = await api.post(`/assignments/${assignmentId}/submit-all`, {
        device_info: deviceInfo
      });

      // Clear all sessions
      phases.forEach(p => clearPhaseSession(p.id));
      localStorage.removeItem(hubKey);

      setShowConfirmModal(false);
      
      // Disable back button prevention before navigating
      if (disableBackButtonPrevention.current) {
        disableBackButtonPrevention.current();
      }
      
      // Clear all history states by replacing the current state
      window.history.replaceState(null, '', window.location.pathname);

      Swal.fire({
        title: 'Tes Terkirim',
        text: 'Jawaban Anda telah berhasil dikirim.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0F172A',
      }).then(() => {
        navigate('/dashboard', { replace: true });
      });
    } catch (err) {
      console.error('Failed to submit all:', err);
      Swal.fire('Kesalahan', err.response?.data?.detail || 'Gagal mengirim tes.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [assignmentId, phases, navigate]);

  // Format time
  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds === undefined) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  return {
    testData,
    phases,
    loading,
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    isLocked,
    isFullscreen,
    enterFullscreen,
    getPhaseAnswers,
    setPhaseAnswers,
    clearPhaseSession,
    getHubProgress,
    setHubProgress,
    submitPhase,
    syncAnswer,
    submitAll,
    loadPhases,
    formatTime,
  };
}
