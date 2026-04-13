/**
 * Shared UI text constants — Bahasa Indonesia
 * Centralized to avoid duplication across 30+ components.
 */

export const LOCKED = {
  title: 'Tes Terkunci',
  message: 'Anda terlalu sering keluar dari mode layar penuh.',
  back: 'Kembali ke Dashboard',
};

export const FULLSCREEN = {
  paused: 'Dijeda',
  returnBtn: 'Kembali ke Layar Penuh',
  notSupported: 'Mode layar penuh tidak didukung di browser Anda. Harap jangan berpindah tab.',
  lockMessage: 'Harap kembali ke mode layar penuh.',
};

export const LOADING = {
  default: 'Memuat...',
  test: 'Memuat Tes...',
  dashboard: 'Memuat dashboard...',
  results: 'Memuat hasil...',
  security: 'Memuat data keamanan...',
  admins: 'Memuat data admin...',
};

export const ERROR = {
  title: 'Kesalahan',
  generic: 'Terjadi kesalahan',
  server: 'Kesalahan server. Harap coba lagi nanti.',
  network: 'Kesalahan jaringan. Harap periksa koneksi Anda.',
  forbidden: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  notFound: 'Sumber daya yang diminta tidak ditemukan.',
  failedLoad: 'Gagal memuat',
  pleaseRetry: 'Harap coba lagi.',
};

export const SUCCESS = {
  title: 'Berhasil',
};

export const BUTTONS = {
  cancel: 'Batal',
  submit: 'Kirim',
  submitAll: 'Kirim Semua',
  submitNow: 'Kirim Sekarang',
  save: 'Simpan',
  saveChanges: 'Simpan Perubahan',
  delete: 'Hapus',
  edit: 'Edit',
  reset: 'Reset',
  back: 'Kembali',
  unlock: 'Buka Kunci',
  next: 'Selanjutnya',
  previous: 'Sebelumnya',
  finish: 'Selesai',
  skip: 'Lewati',
  tryAgain: 'Coba Lagi',
  refresh: 'Muat Ulang',
  close: 'Tutup',
  confirm: 'Ya',
  done: 'Selesai',
  start: 'Mulai',
};

export const TABLE_HEADERS = {
  participant: 'Peserta',
  test: 'Tes',
  score: 'Skor',
  time: 'Waktu',
  completed: 'Selesai',
  actions: 'Aksi',
  username: 'Username',
  fullName: 'Nama Lengkap',
  role: 'Peran',
  department: 'Departemen',
  position: 'Jabatan',
  assignedDate: 'Tanggal Penugasan',
  timestamp: 'Waktu',
};

export const LABELS = {
  username: 'Username',
  password: 'Kata Sandi',
  fullName: 'Nama Lengkap',
  age: 'Usia',
  education: 'Pendidikan',
  department: 'Departemen',
  position: 'Jabatan',
  gender: 'Jenis Kelamin',
  role: 'Peran',
  status: 'Status',
  type: 'Tipe',
  score: 'Skor',
  questions: 'Soal',
};

export const PLACEHOLDERS = {
  searchParticipant: 'Cari peserta...',
  searchAdmin: 'Cari admin...',
};

export const CONFIRMATIONS = {
  deleteParticipant: (name) => `Apakah Anda yakin ingin menghapus ${name}? Semua data akan dihapus secara permanen.`,
  deleteParticipants: (count) => `Hapus ${count} peserta yang dipilih?`,
  resetTest: (name) => `Yakin ingin mereset "${name}"? Semua jawaban dan hasil akan dihapus, dan peserta dapat mengulang tes.`,
  submitAllIQ: (count) => `Semua ${count} fase telah selesai. Kirim semua jawaban?`,
  unlockTest: 'Buka kunci penugasan ini? Peserta dapat melanjutkan tes.',
  resetPassword: (name) => `Reset kata sandi untuk ${name}? Kata sandi baru akan dibuat dan hanya ditampilkan satu kali.`,
  deleteAdmin: (name) => `Yakin ingin menghapus ${name}? Tindakan ini tidak dapat dibatalkan.`,
  assignAllTests: 'Semua tes yang tersedia akan ditugaskan ke peserta ini (kecuali yang sudah ditugaskan). Lanjutkan?',
};

export const MESSAGES = {
  testSubmitted: 'Tes Anda telah dikirim.',
  testLocked: 'Tes terkunci. Anda terlalu sering keluar dari mode layar penuh.',
  allTestsCompleted: 'Semua tes berhasil diselesaikan!',
  incompleteSubmissions: 'Pengiriman Tidak Lengkap',
  incompleteSubmissionsDesc: 'tes dikirim dengan soal yang belum dijawab',
  noResults: 'Tidak ada hasil ditemukan.',
  noParticipants: 'Tidak ada peserta ditemukan.',
  noAdmins: 'Tidak ada admin ditemukan.',
  noLockedAssignments: 'Tidak ada penugasan terkunci.',
  noExitLogs: 'Tidak ada log keluar ditemukan.',
  participantUpdated: 'Data peserta berhasil diperbarui',
  participantDeleted: 'Peserta telah dihapus.',
  adminDeleted: 'Admin telah dihapus.',
  testReset: 'Tes telah direset.',
  assignmentUnlocked: 'Penugasan telah dibuka kuncinya.',
  passwordReset: 'Kata sandi berhasil direset.',
  rowsPerPage: 'Baris per halaman:',
  showing: 'Menampilkan',
  of: 'dari',
  page: 'Halaman',
};

export const ROLES = {
  participant: 'Peserta',
  admin: 'Admin',
  superadmin: 'Superadmin',
};

export const TEST_STATUS = {
  pending: 'Menunggu',
  inProgress: 'Berjalan',
  completed: 'Selesai',
  locked: 'Terkunci',
  incomplete: 'Tidak Lengkap',
  complete: 'Lengkap',
};
