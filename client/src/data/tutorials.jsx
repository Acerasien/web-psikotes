// Sample questions for tutorials (not used in real tests)
export const tutorials = {
    DISC: {
        title: "Tutorial DISC",
        instructions: "Pada tes DISC, Anda akan diminta memilih satu pernyataan yang PALING sesuai (P) dan satu yang PALING tidak sesuai (K) dengan diri Anda.",
        samples: [
            {
                question: "Pilih yang PALING SESUAI dan PALING TIDAK SESUAI",
                options: [
                    { label: "A", content: "Saya suka mengambil risiko" },
                    { label: "B", content: "Saya mudah bergaul dengan orang baru" },
                    { label: "C", content: "Saya pendengar yang baik" },
                    { label: "D", content: "Saya teliti dan cermat" }
                ],
                explanation: "Untuk setiap blok, pilih satu pernyataan paling sesuai (P) dan satu paling tidak sesuai (K)."
            }
        ]
    },
    SPEED: {
        title: "Tutorial Speed Test",
        instructions: "Dalam tes kecepatan, Anda akan melihat dua pasang string. Tentukan apakah keduanya sama persis. Jawab secepat mungkin.",
        samples: [
            {
                question: "Manakah pasangan yang sama persis?",
                options: [
                    { label: "A", content: "A78K || A78K", correct: true },
                    { label: "B", content: "B45M || B54M" },
                    { label: "C", content: "C19P || C19R" },
                    { label: "D", content: "D82Q || D28Q" }
                ],
                explanation: "Hanya pasangan A yang benar-benar sama. Pilih jawaban yang tepat."
            }
        ]
    },
    TEMP: {
        title: "Tutorial Temperamen",
        instructions: "Pilih seberapa setuju Anda dengan setiap pernyataan, dari 1 (Sangat Tidak Setuju) hingga 6 (Sangat Setuju).",
        samples: [
            {
                question: "Saya senang menjadi pusat perhatian.",
                options: [
                    { label: "1", content: "Sangat Tidak Setuju" },
                    { label: "2", content: "Tidak Setuju" },
                    { label: "3", content: "Agak Tidak Setuju" },
                    { label: "4", content: "Agak Setuju" },
                    { label: "5", content: "Setuju" },
                    { label: "6", content: "Sangat Setuju" }
                ],
                explanation: "Pilih tingkat kesesuaian Anda. Tidak ada jawaban benar atau salah."
            }
        ]
    },
    MEM: {
        title: "Tutorial Memory Test",
        instructions: "Tes ini terdiri dari dua fase: menghafal dan menjawab.",
        samples: [
            {
                // Step 1: Explanation + table preview (non‑interactive)
                question: "Fase 1: Menghafal",
                content: (
                    <div>
                        <p className="mb-4">Anda akan melihat tabel berikut selama <strong>3 menit</strong>. Hafalkan pasangan nama dan kode.</p>
                        <div className="overflow-x-auto my-6">
                            <table className="border-collapse border border-gray-400 mx-auto">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-400 px-3 py-2">Kategori</th>
                                        <th className="border border-gray-400 px-3 py-2">Nama</th>
                                        <th className="border border-gray-400 px-3 py-2">Kode</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="border border-gray-400 px-3 py-2">KOTAK ROKOK</td><td className="border border-gray-400 px-3 py-2">ESKORT</td><td className="border border-gray-400 px-3 py-2">703</td></tr>
                                    <tr><td className="border border-gray-400 px-3 py-2">PENERBANGAN</td><td className="border border-gray-400 px-3 py-2">BARAT</td><td className="border border-gray-400 px-3 py-2">MG</td></tr>
                                    <tr><td className="border border-gray-400 px-3 py-2">JURU BAYAR</td><td className="border border-gray-400 px-3 py-2">SABUN</td><td className="border border-gray-400 px-3 py-2">2B</td></tr>
                                    <tr><td className="border border-gray-400 px-3 py-2">NOMOR TILPUN</td><td className="border border-gray-400 px-3 py-2">ADI</td><td className="border border-gray-400 px-3 py-2">23</td></tr>
                                    <tr><td className="border border-gray-400 px-3 py-2">BUKU GUDANG</td><td className="border border-gray-400 px-3 py-2">KAWAT</td><td className="border border-gray-400 px-3 py-2">Q40</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p>Setelah waktu habis, tabel akan ditutup dan Anda akan menjawab 50 pertanyaan.</p>
                    </div>
                ),
                options: [{ label: "Lanjut", next: true }]   // special flag
            },
            {
                // Step 2: Sample recall question (interactive)
                question: "Contoh pertanyaan:",
                content: "Apa kode dari ESKORT?",
                options: [
                    { label: "A", content: "703", correct: true },
                    { label: "B", content: "618" },
                    { label: "C", content: "610" },
                    { label: "D", content: "721" }
                ],
                explanation: "Dalam tabel, ESKORT memiliki kode 703. Pilih jawaban yang benar."
            }
        ]
    },
    LOGIC: {
        title: "Tutorial Logika & Aritmatika",
        instructions: "Baca soal cerita dengan saksama, lalu pilih jawaban yang benar. Anda dapat menandai soal yang ragu.",
        samples: [
            {
                question: "Budi membeli 3 buku seharga Rp15.000 per buku dan 2 pensil seharga Rp2.500 per pensil. Berapa total yang harus dibayar Budi?",
                options: [
                    { label: "A", content: "Rp45.000" },
                    { label: "B", content: "Rp50.000", correct: true },
                    { label: "C", content: "Rp47.500" },
                    { label: "D", content: "Rp52.500" }
                ],
                explanation: "Total = (3 × 15.000) + (2 × 2.500) = 45.000 + 5.000 = 50.000."
            }
        ]
    },
    LEAD: {
        title: "Tutorial PAPI Kostick",
        instructions: "Pada tes ini, Anda akan melihat dua pernyataan di setiap nomor. Pilih SATU pernyataan yang paling sesuai dengan diri Anda. Tidak ada jawaban benar atau salah — pilihlah yang paling menggambarkan kepribadian Anda.",
        samples: [
            {
                question: "Pilih satu pernyataan yang paling sesuai dengan diri Anda:",
                options: [
                    { label: "A", content: "Saya suka memimpin diskusi kelompok", correct: true },
                    { label: "B", content: "Saya senang membantu rekan yang kesulitan" }
                ],
                explanation: "Pilih pernyataan yang paling mencerminkan diri Anda. Di tes sesungguhnya, ada 90 pasangan pernyataan yang harus dijawab."
            }
        ]
    }
};