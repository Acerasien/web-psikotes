// client/src/hooks/useFullscreenLock.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export function useFullscreenLock({ assignmentId, token, onLock }) {
    const [exitCount, setExitCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true);

    // ✅ Stable enterFullscreen function (memoized)
    const enterFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    }, []); // No dependencies → never changes

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = document.fullscreenElement !== null;
            if (!isCurrentlyFullscreen && !isLocked) {
                const newCount = exitCount + 1;
                setExitCount(newCount);

                axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/exit-log`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(err => console.error("Failed to log exit", err));

                if (newCount >= 3) {
                    setIsLocked(true);
                    axios.post(`http://127.0.0.1:8000/assignments/${assignmentId}/lock`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => console.error(err));
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
    }, [exitCount, isLocked, assignmentId, token, onLock]); // Dependencies are stable

    return { isLocked, isFullscreen, enterFullscreen };
}