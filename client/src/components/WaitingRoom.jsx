// client/src/components/WaitingRoom.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function WaitingRoom({ assignmentId, onUnlock }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.getSessionStatus(assignmentId);
            setStatus(res.data);
            if (res.data.is_open) {
                onUnlock();
            }
        } catch (err) {
            console.error('Failed to fetch session status', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const pollInterval = setInterval(fetchData, 10000);
        return () => clearInterval(pollInterval);
    }, [assignmentId]);

    useEffect(() => {
        if (!status || status.is_open) return;

        const timer = setInterval(() => {
            setStatus(prev => {
                // Only auto-unlock if we are actually waiting for the start time
                // Don't auto-unlock if we are already past the end_time (Expired)
                const isPastEnd = prev.end_time && new Date() > new Date(prev.end_time);
                
                if (!isPastEnd && prev.seconds_until_start <= 1 && prev.seconds_until_start > 0) {
                    onUnlock();
                    return { ...prev, is_open: true, seconds_until_start: 0 };
                }
                
                if (prev.seconds_until_start > 0) {
                    return { ...prev, seconds_until_start: prev.seconds_until_start - 1 };
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-neutral-500 font-medium text-sm md:text-base">Menghubungkan ke server ujian...</p>
        </div>
    );

    return (
        <div className="text-center py-4 md:py-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-1 md:mb-2 font-display px-2">Ruang Tunggu Ujian</h2>
            <p className="text-sm md:text-base text-neutral-500 font-medium mb-6 md:mb-8 px-4">
                {status?.name ? `Sesi: ${status.name}` : 'Harap tunggu hingga waktu ujian dimulai.'}
            </p>

            <div className="bg-neutral-900 rounded-[2rem] p-6 md:p-10 shadow-2xl border-4 border-neutral-800 w-full max-w-[280px] md:max-w-sm mx-auto mb-6 md:mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/20">
                    <div 
                        className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${status?.is_open ? 100 : (1 - (status?.seconds_until_start % 60) / 60) * 100}%` }}
                    ></div>
                </div>
                <p className="text-primary-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-4">
                    {status?.end_time && new Date() > new Date(status.end_time) ? 'Sesi Berakhir' : 'Waktu Tersisa'}
                </p>
                <p className="text-4xl md:text-6xl font-mono font-bold text-white tracking-widest">
                    {status?.end_time && new Date() > new Date(status.end_time) ? 'CLOSED' : formatTime(status?.seconds_until_start || 0)}
                </p>
            </div>

            <div className="space-y-3 md:space-y-4 text-xs md:text-sm text-neutral-500 max-w-md mx-auto px-4">
                <div className="flex items-start gap-3 p-3 md:p-4 bg-primary-50 text-primary-800 rounded-xl border border-primary-100">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-left leading-relaxed">
                        Ujian akan terbuka secara otomatis saat hitungan mundur selesai. Jangan tutup halaman ini.
                    </p>
                </div>
                <p className="italic font-medium">Harap pastikan koneksi internet Anda stabil.</p>
            </div>
        </div>
    );
}

export default WaitingRoom;
