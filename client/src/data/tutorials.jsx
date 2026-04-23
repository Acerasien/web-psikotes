// Sample questions for tutorials (not used in real tests)
export const tutorials = {
    DISC: {
        title: "Tutorial DISC",
        instructions: "Pada tes ini, Anda akan melihat beberapa kelompok pernyataan yang menggambarkan karakter atau perilaku seseorang. Tugas Anda adalah memilih satu pernyataan yang PALING menggambarkan diri Anda dan satu pernyataan yang PALING TIDAK menggambarkan diri Anda. Tidak ada jawaban benar atau salah. Jawablah secara jujur sesuai dengan kondisi diri Anda sehari-hari, bukan berdasarkan harapan atau keinginan.\n\nCatatan:\n Waktu mengerjakan tes ini 10 menit. Apabila waktu habis, maka Anda akan otomatis keluar dari tes.\n• Anda tidak boleh memilih lebih dari satu pernyataan untuk tiap kategori Paling menggambarkan dan Paling Tidak Menggambarkan.\n• Pilih 2 (dua) pernyataan di setiap nomor: satu pernyataan yang paling menggambarkan diri Anda dan satu yang paling tidak menggambarkan diri Anda, dari empat pernyataan yang ada.",
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
        instructions: "Pada tes ini, Anda diminta untuk mencari pasangan pilihan yang identik dari beberapa opsi yang tersedia. Setiap pilihan berisi kombinasi huruf, angka, simbol, atau gabungan dari ketiganya. Tugas Anda adalah memilih pasangan yang memiliki sisi kiri dan kanan yang sama persis.\n\nCatatan:\n Waktu pengerjaan untuk tes ini adalah 10 menit. Waktu akan berjalan mundur, dan setelah waktu habis, Anda tidak dapat melanjutkan pengerjaan.\n• Setiap jawaban yang Anda pilih akan secara otomatis mengarahkan Anda ke soal berikutnya, dan jawaban yang sudah dipilih tidak dapat diubah. Oleh karena itu, pastikan Anda menjawab dengan teliti dan yakin bahwa pilihan Anda sudah benar dan tepat.\n• Usahakan untuk menjawab sebanyak mungkin soal dengan akurat, sesuai dengan kemampuan Anda.",
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
        instructions: "Tes ini berisi beberapa pernyataan terkait diri Anda dalam kehidupan sehari-hari. Silakan pilih jawaban yang paling menggambarkan diri Anda. Jawablah secara jujur dan spontan. Tidak ada jawaban benar atau salah.\n\nCatatan:\n Waktu mengerjakan soal ini 5 menit. Apabila waktu habis, maka Anda otomatis akan langsung keluar dari tes.\n• Fokus pada pernyataan berdasarkan kondisi diri yang paling sering muncul pada diri Anda.\n• Pilih pernyataan secara spontan tanpa terlalu lama berpikir.",
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
        instructions: "Pada tes ini, Anda akan diminta untuk mengingat sejumlah informasi berdasarkan Jenis, Nama dan Kode pada Kotak yang ditampilkan dalam waktu tiga menit. Informasi yang diberikan dapat berupa kata, angka, huruf, atau kombinasi dari beberapa unsur tersebut.\n\nCatatan:\n Fokus dan perhatikan setiap detail informasi dengan baik.\n• Gunakan strategi mengingat yang menurut Anda paling efektif.\n• Kerjakan dengan jujur tanpa bantuan alat apa pun.\n• Anda tidak diperbolehkan mencatat selama proses menghafal.\n• Waktu pengerjaan terbatas, gunakan waktu sebaik mungkin.",
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
        instructions: "Ini merupakan tes untuk kemampuan memecahkan masalah. Tes ini mencakup berbagai jenis pertanyaan yang harus diselesaikan tanpa alat bantu apapun. Tes ini berisi 50 pertanyaan yang secara bertahap menjadi semakin sulit. Anda tidak mungkin dapat menyelesaikan semua pertanyaan, tetapi selesaikan seluruh Tes semampu Anda.\n\nCatatan:\n Kerjakan dengan jujur tanpa bantuan alat apa pun seperti kalkulator, handphone, ataupun AI.\n• Anda tidak mungkin dapat menyelesaikan semua pertanyaan, tetapi selesaikan seluruh Tes semampu Anda.\n• Waktu mengerjakan tes ini 12 menit, mohon jawab dengan benar sebanyak mungkin dan semampu Anda.\n• Kerjakan dengan teliti, namun jangan menghabiskan waktu lama pada setiap pertanyaan atau lewati pertanyaan itu.",
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
        instructions: "Tes ini terdiri dari sejumlah pasangan pernyataan. Setiap pasangan berisi dua pilihan perilaku. Tugas Anda adalah memilih satu pernyataan yang paling sesuai dengan diri Anda. Tidak ada jawaban benar atau salah. Pilihlah jawaban yang paling mencerminkan diri Anda dalam situasi kerja.\n\nCatatan:\n Waktu mengerjakan tes ini 20 menit.\n• Anda tidak diperbolehkan mengosongkan jawaban. Semua pernyataan wajib dipilih sesuai dengan diri Anda.\n• Jawab pasangan pernyataan secara spontan dan jangan terlalu lama berpikir.",
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
