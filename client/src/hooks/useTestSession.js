// client/src/hooks/useTestSession.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { useFullscreenLock } from './useFullscreenLock';

/**
 * Shared test session logic for all test types
 * @param {number} assignmentId - The assignment ID
 * @param {object} options - Additional options
 * @param {boolean} options.requireAllAnswers - Whether all questions must be answered
 * @param {function} options.formatAnswers - Function to format answers for submission
 * @param {function} options.onTestComplete - Callback when test is completed
 */
export function useTestSession(assignmentId, options = {}) {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const {
    requireAllAnswers = true,
    formatAnswers = null,
    onTestComplete
  } = options;

  // Test state
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Refs for stable callbacks
  const answersRef = useRef(answers);
  const testDataRef = useRef(testData);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    testDataRef.current = testData;
  }, [testData]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Fullscreen lock
  const { isLocked, isFullscreen, enterFullscreen } = useFullscreenLock({
    assignmentId,
    token
  });

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await api.startTest(assignmentId);
        setTestData(res.data);
        setQuestions(res.data.questions || []);
        setTimeLeft(res.data.time_limit === 0 ? null : res.data.time_limit);
        setLoading(false);
        enterFullscreen();
      } catch (err) {
        console.error('Failed to load test:', err);
        setLoading(false);
        if (err.response?.status === 403 && err.response.data.detail.includes('locked')) {
          Swal.fire('Test Locked', 'You have exited fullscreen too many times.', 'error');
        } else {
          Swal.fire('Error', 'Failed to load test. Please try again.', 'error');
        }
        navigate('/dashboard');
      }
    };
    loadTest();
  }, [assignmentId, enterFullscreen, navigate]);

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

  // Timer
  useEffect(() => {
    if (timeLeft === null || loading || isLocked) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, loading, isLocked]);

  // Submit test
  const handleSubmit = useCallback(async (isTimeout = false) => {
    const currentAnswers = answersRef.current;
    const currentTestData = testDataRef.current;
    const currentTimeLeft = timeLeftRef.current;

    // Check if all questions answered
    const answeredCount = Object.keys(currentAnswers).length;
    const totalQuestions = currentTestData?.questions?.length || 0;

    if (requireAllAnswers && !isTimeout && answeredCount < totalQuestions) {
      Swal.fire({
        title: 'Belum Lengkap',
        text: `Anda baru menjawab ${answeredCount} dari ${totalQuestions} pertanyaan.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsSubmitting(true);
    const timeTaken = currentTestData?.time_limit === 0 ? 0 : (currentTestData?.time_limit || 0) - (currentTimeLeft ?? 0);

    try {
      // Use custom formatter or default
      const finalAnswers = formatAnswers 
        ? formatAnswers(currentAnswers)
        : Object.keys(currentAnswers).map(qId => ({
            question_id: parseInt(qId),
            option_id: currentAnswers[qId],
            type: 'single'
          }));

      await api.submitTest(assignmentId, finalAnswers, timeTaken);

      if (isTimeout) {
        Swal.fire('Waktu Habis', 'Tes telah dikirim otomatis.', 'info');
      }

      if (onTestComplete) {
        onTestComplete();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to submit test:', err);
      setIsSubmitting(false);
      Swal.fire('Error', 'Failed to submit test.', 'error');
    }
  }, [assignmentId, formatAnswers, requireAllAnswers, onTestComplete, navigate]);

  // Format time
  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds === undefined) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  return {
    // State
    testData,
    questions,
    answers,
    setAnswers,
    timeLeft,
    loading,
    isSubmitting,
    showConfirmModal,
    setShowConfirmModal,
    
    // Fullscreen
    isLocked,
    isFullscreen,
    enterFullscreen,
    
    // Actions
    handleSubmit,
    formatTime,
  };
}
