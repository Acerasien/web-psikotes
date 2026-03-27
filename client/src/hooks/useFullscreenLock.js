// client/src/hooks/useFullscreenLock.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import Swal from 'sweetalert2';

export function useFullscreenLock({ assignmentId, token, onLock }) {
    const [exitCount, setExitCount] = useState(() => {
        // Restore exitCount from sessionStorage on mount
        const saved = sessionStorage.getItem(`fullscreen_exit_${assignmentId}`);
        return saved ? parseInt(saved, 10) : 0;
    });
    const [isLocked, setIsLocked] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true); // Start as true, will be updated
    const [isInitialized, setIsInitialized] = useState(false);

    // Save exitCount to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem(`fullscreen_exit_${assignmentId}`, exitCount.toString());
    }, [exitCount, assignmentId]);

    // Initialize fullscreen state after a small delay to avoid counting browser's F5 exit
    useEffect(() => {
        const timer = setTimeout(() => {
            const isCurrentlyFullscreen = document.fullscreenElement !== null;
            setIsFullscreen(isCurrentlyFullscreen);
            setIsInitialized(true);
        }, 100); // 100ms delay to let browser finish its fullscreen exit animation
        
        return () => clearTimeout(timer);
    }, []);

    // ✅ Stable enterFullscreen function (memoized)
    const enterFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = document.fullscreenElement !== null;

            if (!isCurrentlyFullscreen && !isLocked && isInitialized) {
                const newCount = exitCount + 1;
                setExitCount(newCount);

                api.logExit(assignmentId).catch(err => console.error("Failed to log exit", err));

                if (newCount >= 3) {
                    setIsLocked(true);
                    api.lockAssignment(assignmentId).catch(err => console.error(err));
                    // Clear session storage on lock
                    sessionStorage.removeItem(`fullscreen_exit_${assignmentId}`);
                    sessionStorage.removeItem(`test_session_${assignmentId}`);
                    Swal.fire({
                        title: 'Test Locked',
                        text: 'You have exited fullscreen too many times.',
                        icon: 'error',
                        allowOutsideClick: false
                    });
                    if (onLock) onLock();
                } else {
                    setIsFullscreen(false);
                    Swal.fire({
                        title: `Warning ${newCount}/3`,
                        text: 'Please return to fullscreen immediately!',
                        icon: 'warning',
                        timer: 3000,
                        timerProgressBar: true
                    });
                }
            } else if (isCurrentlyFullscreen) {
                setIsFullscreen(true);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [exitCount, isLocked, isInitialized, assignmentId, onLock]);

    return { isLocked, isFullscreen, enterFullscreen, exitCount, setExitCount };
}