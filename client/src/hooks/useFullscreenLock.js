// client/src/hooks/useFullscreenLock.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import Swal from 'sweetalert2';

// Check if fullscreen API is supported
const isFullscreenSupported = () => {
    return !!(
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen ||  // Safari
        document.documentElement.msRequestFullscreen  // IE/Edge
    );
};

export function useFullscreenLock({ assignmentId, token, onLock }) {
    const [exitCount, setExitCount] = useState(() => {
        // Restore exitCount from localStorage on mount
        const saved = localStorage.getItem(`fullscreen_exit_${assignmentId}`);
        return saved ? parseInt(saved, 10) : 0;
    });
    const [isLocked, setIsLocked] = useState(false);
    
    // Check fullscreen support - if not supported (e.g., iOS Safari), start as fullscreen
    const fullscreenSupported = isFullscreenSupported();
    const [isFullscreen, setIsFullscreen] = useState(fullscreenSupported ? false : true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Save exitCount to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(`fullscreen_exit_${assignmentId}`, exitCount.toString());
    }, [exitCount, assignmentId]);

    // Initialize fullscreen state after a small delay to avoid counting browser's F5 exit
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fullscreenSupported) {
                const isCurrentlyFullscreen = document.fullscreenElement !== null;
                setIsFullscreen(isCurrentlyFullscreen);
            }
            setIsInitialized(true);
        }, 100); // 100ms delay to let browser finish its fullscreen exit animation

        return () => clearTimeout(timer);
    }, [fullscreenSupported]);

    // ✅ Stable enterFullscreen function (memoized)
    const enterFullscreen = useCallback(() => {
        if (!fullscreenSupported) return; // Skip if not supported

        const elem = document.documentElement;
        // Safari requires webkit prefix
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();  // Safari
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();  // IE/Edge

        // Proactive sync: If already in fullscreen, ensure state is updated
        // This handles cases where requestFullscreen doesn't trigger a change event
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            setIsFullscreen(true);
        }
    }, [fullscreenSupported]);

    useEffect(() => {
        const handleViolation = () => {
            if (isLocked || !isInitialized) return;

            const newCount = exitCount + 1;
            setExitCount(newCount);

            api.logExit(assignmentId).catch(err => console.error("Gagal mencatat keluar", err));

            if (newCount >= 100) { // Effectively disabling the lock by setting it to a very high number
                // We keep the structure in case we want to re-enable it later
                setIsLocked(true);
                api.lockAssignment(assignmentId).catch(err => console.error(err));
                localStorage.removeItem(`fullscreen_exit_${assignmentId}`);
                localStorage.removeItem(`test_session_${assignmentId}`);
                Swal.fire({
                    title: 'Tes Terkunci',
                    text: 'Anda terlalu sering keluar dari area tes.',
                    icon: 'error',
                    allowOutsideClick: false
                });
                if (onLock) onLock();
            } else {
                setIsFullscreen(false);
                Swal.fire({
                    title: `Peringatan`,
                    text: 'Harap kembali ke area tes segera! Percobaan keluar akan dicatat.',
                    icon: 'warning',
                    timer: 3000,
                    timerProgressBar: true
                });
            }
        };

        const handleFullscreenChange = () => {
            if (!fullscreenSupported) return;
            const isCurrentlyFullscreen = document.fullscreenElement !== null;
            if (!isCurrentlyFullscreen) {
                handleViolation();
            } else {
                setIsFullscreen(true);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleViolation();
            }
        };

        const handleBlur = () => {
            // Small delay to ensure it wasn't a transient blur (like a browser popup)
            setTimeout(() => {
                if (!document.hasFocus() && !isLocked && isInitialized) {
                    handleViolation();
                }
            }, 500);
        };

        const handleFocus = () => {
            // If we regain focus and we're still in fullscreen, resync the state
            if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
                setIsFullscreen(true);
            }
        };

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        
        // Listen for tab switching
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for window blurring (clicking away)
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [exitCount, isLocked, isInitialized, assignmentId, onLock, fullscreenSupported]);

    return { isLocked, isFullscreen, enterFullscreen, exitCount, setExitCount };
}
