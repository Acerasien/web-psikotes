import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';


function WaitingRoom({ assignmentId, onUnlock, onBack }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.getSessionStatus(assignmentId);
            setStatus(res.data);
            if (res.data.is_open) {
                onUnlock();
            }
        } catch (error) {
            console.error("Error fetching session status:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
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
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-neutral-500 font-medium text-sm md:text-base">Menghubungkan ke server ujian...</p>
        </div>
    );

    const isExpired = status?.end_time && new Date() > new Date(status.end_time);

    return (
        <div className="text-center py-4 md:py-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2 md:mb-4">Ruang Tunggu Ujian</h1>
            <p className="text-sm md:text-base text-neutral-500 mb-6 md:mb-10 max-w-md mx-auto px-4">
                {isExpired 
                    ? 'Sesi ujian ini telah berakhir dan tidak dapat dimasuki lagi.' 
                    : 'Harap tunggu hingga waktu ujian dimulai.'}
            </p>

            <div className="bg-neutral-900 rounded-[2rem] p-6 md:p-10 shadow-2xl border-4 border-neutral-800 w-full max-w-[280px] md:max-w-sm mx-auto mb-6 md:mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/20">
                    <div 
                        className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${status?.is_open ? 100 : (1 - (status?.seconds_until_start % 60) / 60) * 100}%` }}
                    ></div>
                </div>
                <p className="text-primary-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-4">
                    {isExpired ? 'Sesi Berakhir' : 'Waktu Tersisa'}
                </p>
                <p className="text-4xl md:text-6xl font-mono font-bold text-white tracking-widest">
                    {isExpired ? 'CLOSED' : formatTime(status?.seconds_until_start || 0)}
                </p>
            </div>

            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 flex items-start gap-3 md:gap-4 text-left max-w-md mx-auto">
                <div className="bg-primary-100 p-2 rounded-full mt-0.5 shrink-0">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-xs md:text-sm text-primary-800 leading-relaxed">
                    {isExpired
                        ? 'Sesi ini sudah ditutup oleh sistem. Harap hubungi administrator jika Anda memerlukan akses tambahan.'
                        : 'Ujian akan terbuka secara otomatis saat hitungan mundur selesai. Jangan tutup halaman ini.'}
                </p>
            </div>

            <p className="text-xs text-neutral-400 italic mb-10">Harap pastikan koneksi internet Anda stabil.</p>

            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-neutral-500 hover:text-primary-600 font-bold text-sm mx-auto transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Dashboard
            </button>
        </div>
    );
}

export default WaitingRoom;
