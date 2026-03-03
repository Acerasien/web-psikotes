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
        instructions: "Anda akan melihat tabel selama 3 menit. Hafalkan pasangan nama dan kode. Setelah itu, Anda akan menjawab 50 pertanyaan tentang tabel tersebut.",
        samples: [
            {
                question: "Apa kode dari ESKORT?",
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
    }
};