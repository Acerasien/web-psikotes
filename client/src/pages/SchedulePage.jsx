// client/src/pages/SchedulePage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import PageWrapper from '../components/PageWrapper';
import Swal from 'sweetalert2';

function SchedulePage() {
    const [sessions, setSessions] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);
    const [editSessionId, setEditSessionId] = useState(null);

    const getDefaultStartTime = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T09:00`;
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        start_time: getDefaultStartTime(),
        end_time: '',
        participant_ids: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [classes, setClasses] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sessionRes, userRes, classRes] = await Promise.all([
                api.getSessions(),
                api.getUsers(),
                api.getClasses()
            ]);
            setSessions(sessionRes.data || []);
            // Only participants for the picker
            setParticipants(userRes.data.filter(u => u.role === 'participant') || []);
            setClasses(classRes.data || []);
        } catch (err) {
            console.error('Failed to fetch schedule data', err);
            setError('Gagal memuat data penjadwalan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openEditDrawer = (session) => {
        setEditSessionId(session.id);
        
        // Helper to handle dates simply as local strings
        const formatForInput = (dateStr) => {
            if (!dateStr) return '';
            // If it's a full ISO string, just take the first 16 chars (YYYY-MM-DDTHH:mm)
            return dateStr.slice(0, 16).replace(' ', 'T');
        };
        
        setFormData({
            name: session.name,
            start_time: formatForInput(session.start_time),
            end_time: formatForInput(session.end_time),
            participant_ids: session.participant_ids || []
        });
        setShowDrawer(true);
    };

    const handleCloseDrawer = () => {
        setShowDrawer(false);
        setEditSessionId(null);
        setFormData({ name: '', start_time: getDefaultStartTime(), end_time: '', participant_ids: [] });
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (formData.participant_ids.length === 0) {
            Swal.fire('Peringatan', 'Pilih setidaknya satu peserta', 'warning');
            return;
        }

        try {
            // Send strings directly to avoid timezone conversion jumps
            const payload = {
                name: formData.name,
                start_time: formData.start_time,
                end_time: formData.end_time || null,
                participant_ids: formData.participant_ids
            };

            console.log("Saving session payload (Naive):", payload);

            if (editSessionId) {
                await api.updateSession(editSessionId, payload);
                Swal.fire('Berhasil', 'Jadwal tes berhasil diperbarui', 'success');
            } else {
                await api.createSession(payload);
                Swal.fire('Berhasil', 'Jadwal tes berhasil dibuat', 'success');
            }

            handleCloseDrawer();
            fetchData();
        } catch (err) {
            console.error("Save error:", err);
            Swal.fire('Kesalahan', err.response?.data?.detail || 'Gagal menyimpan jadwal', 'error');
        }
    };

    const toggleUnlock = async (sessionId) => {
        try {
            const res = await api.toggleSessionUnlock(sessionId);
            setSessions(sessions.map(s => s.id === sessionId ? { ...s, is_unlocked: res.data.is_unlocked } : s));
            Swal.fire('Status Diperbarui', res.data.is_unlocked ? 'Sesi telah dibuka kuncinya' : 'Sesi kembali dikunci', 'success');
        } catch (err) {
            Swal.fire('Kesalahan', 'Gagal memperbarui status kunci', 'error');
        }
    };

    const handleDelete = async (sessionId) => {
        const result = await Swal.fire({
            title: 'Hapus Jadwal?',
            text: 'Tindakan ini akan membatalkan jadwal untuk semua peserta di grup ini.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, hapus'
        });

        if (result.isConfirmed) {
            try {
                await api.deleteSession(sessionId);
                fetchData();
                Swal.fire('Dihapus', 'Jadwal telah dibatalkan', 'success');
            } catch (err) {
                Swal.fire('Kesalahan', 'Gagal menghapus jadwal', 'error');
            }
        }
    };

    const toggleParticipantSelection = (id) => {
        setFormData(prev => ({
            ...prev,
            participant_ids: prev.participant_ids.includes(id)
                ? prev.participant_ids.filter(pId => pId !== id)
                : [...prev.participant_ids, id]
        }));
    };

    const filteredParticipants = participants
        .filter(p => {
            const nameMatch = (p.full_name || p.username).toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (p.department || '').toLowerCase().includes(searchTerm.toLowerCase());
            const classMatch = !classFilter || String(p.class_id) === String(classFilter);
            return nameMatch && classMatch;
        })
        .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // Newest first
        });

    const getStatusColor = (session) => {
        const now = new Date();
        const start = new Date(session.start_time);
        const end = session.end_time ? new Date(session.end_time) : null;
        
        if (session.is_unlocked) return 'bg-success text-white';
        if (end && now > end) return 'bg-neutral-400 text-white';
        if (now >= start) return 'bg-primary-500 text-white';
        return 'bg-warning text-white';
    };

    return (
        <>
            <PageWrapper loading={loading} error={error} onRetry={fetchData}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 font-display">Penjadwalan Tes</h1>
                            <p className="text-neutral-500 font-medium">Kelola gelombang dan sesi ujian peserta</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditSessionId(null);
                                setFormData({ name: '', start_time: getDefaultStartTime(), end_time: '', participant_ids: [] });
                                setShowDrawer(true);
                            }}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Buat Jadwal Baru
                        </button>
                    </div>

                    {/* Sessions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sessions.length === 0 ? (
                            <div className="lg:col-span-2 bg-white p-12 text-center rounded-2xl border-2 border-dashed border-neutral-200">
                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-1">Belum Ada Jadwal</h3>
                                <p className="text-neutral-500">Klik "Buat Jadwal Baru" untuk mulai mengatur sesi ujian.</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-neutral-200 p-6 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-neutral-900">{session.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(session)}`}>
                                                    {session.is_unlocked ? 'Terbuka (Manual)' : (
                                                        session.end_time && new Date() > new Date(session.end_time) 
                                                            ? 'Berakhir' 
                                                            : (new Date() >= new Date(session.start_time) ? 'Berjalan' : 'Terjadwal')
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                                {session.participant_count} Peserta Terdaftar
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openEditDrawer(session)}
                                                className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Edit Jadwal"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(session.id)}
                                                className="p-2 text-neutral-400 hover:text-error hover:bg-error-light/10 rounded-lg transition-colors"
                                                title="Hapus Jadwal"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Waktu Mulai</p>
                                            <p className="text-sm font-bold text-neutral-700">
                                                {new Date(session.start_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Waktu Selesai</p>
                                            <p className="text-sm font-bold text-neutral-700">
                                                {session.end_time ? new Date(session.end_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tidak Dibatasi'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Participant List Preview */}
                                    <div className="mb-6 p-4 bg-neutral-50/50 rounded-xl border border-neutral-100">
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Peserta Terdaftar:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {session.participant_ids?.slice(0, 10).map(pid => {
                                                const p = participants.find(u => u.id === pid);
                                                return p ? (
                                                    <span key={pid} className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-600 rounded-lg text-[10px] font-bold shadow-sm">
                                                        {p.full_name || p.username}
                                                    </span>
                                                ) : null;
                                            })}
                                            {session.participant_ids?.length > 10 && (
                                                <span className="px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-bold border border-primary-100">
                                                    +{session.participant_ids.length - 10} lainnya
                                                </span>
                                            )}
                                            {(!session.participant_ids || session.participant_ids.length === 0) && (
                                                <span className="text-xs text-neutral-400 italic">Belum ada peserta</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${session.is_unlocked ? 'bg-success animate-pulse' : 'bg-neutral-200'}`}></div>
                                            <span className="text-sm font-bold text-neutral-600">Master Key Status</span>
                                        </div>
                                        <button
                                            onClick={() => toggleUnlock(session.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                                                session.is_unlocked 
                                                    ? 'border-error text-error hover:bg-error hover:text-white' 
                                                    : 'border-success text-success hover:bg-success hover:text-white'
                                            }`}
                                        >
                                            {session.is_unlocked ? 'Kunci Sekarang' : 'Buka Sekarang'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PageWrapper>

        {/* Create Session Drawer Overlay - Using Portal to bypass any parent containing blocks */}
        {showDrawer && createPortal(
            <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" 
                    onClick={handleCloseDrawer}
                ></div>
                
                {/* Drawer Panel */}
                <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full animate-slide-left border-l border-neutral-200">
                    <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">{editSessionId ? 'Edit Jadwal' : 'Buat Jadwal Baru'}</h2>
                            <p className="text-xs font-medium text-neutral-500">
                                {editSessionId ? 'Perbarui gelombang tes dan daftar peserta' : 'Atur gelombang tes dan pilih peserta'}
                            </p>
                        </div>
                        <button onClick={handleCloseDrawer} className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleCreateSession} className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Nama Sesi / Gelombang</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Contoh: Recruitment Staff IT Gelombang 1"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Waktu Mulai</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Waktu Selesai (Opsional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-neutral-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pilih Peserta ({formData.participant_ids.length})</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="bg-white border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-500 uppercase tracking-tight px-2 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                                        value={classFilter}
                                        onChange={(e) => setClassFilter(e.target.value)}
                                    >
                                        <option value="">Semua Kelas</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Cari nama..."
                                            className="pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs w-32 focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100 max-h-80 overflow-y-auto bg-neutral-50">
                                {filteredParticipants.map((p) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => toggleParticipantSelection(p.id)}
                                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                            formData.participant_ids.includes(p.id) ? 'bg-primary-50' : 'hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                formData.participant_ids.includes(p.id) ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500'
                                            }`}>
                                                {(p.full_name || p.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${formData.participant_ids.includes(p.id) ? 'text-primary-700' : 'text-neutral-700'}`}>
                                                    {p.full_name || p.username}
                                                </p>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">{p.department || 'No Dept'}</p>
                                            </div>
                                        </div>
                                        {formData.participant_ids.includes(p.id) && (
                                            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                ))}
                                {filteredParticipants.length === 0 && (
                                    <div className="p-8 text-center text-neutral-400 text-sm">Tidak ada peserta ditemukan</div>
                                )}
                            </div>
                        </div>
                    </form>

                    <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex gap-4">
                        <button
                            onClick={handleCloseDrawer}
                            className="flex-1 py-3 px-6 rounded-xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-100 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCreateSession}
                            className="flex-[2] py-3 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-md active:scale-95"
                        >
                            {editSessionId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slide-left {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-left {
                    animation: slide-left 0.3s ease-out;
                }
            `}} />
        </>
    );
}

export default SchedulePage;
