# server/seed_logic.py
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# Define 50 questions with content and options (correct answer marked)
# For image questions, content includes HTML img tags
# For multiple correct answers (Q23, Q41), correct_index is a list
questions_data = [
    # Q1 - "Awal tahun ini" = Januari → bulan sebelumnya = Desember
    {
        "content": "Bulan lalu pada awal tahun ini adalah...",
        "options": ["Januari", "Maret", "Juli", "Desember", "Oktober"],
        "correct_index": 3  # Desember
    },
    # Q2 - Menangkap = to catch → lawan = membebaskan
    {
        "content": "MENANGKAP adalah lawan kata dari...",
        "options": ["meletakkan", "membebaskan", "beresiko", "berusaha", "turun tingkat"],
        "correct_index": 1  # membebaskan
    },
    # Q3 - Januari, Agustus, Oktober, Desember = bulan. Rabu = hari
    {
        "content": "Sebagian besar hal dibawah ini serupa satu sama lain. Manakah salah satu diantaranya yang kurang serupa dengan yang lain?",
        "options": ["Januari", "Agustus", "Rabu", "Oktober", "Desember"],
        "correct_index": 2  # Rabu (hari bukan bulan)
    },
    # Q4 - RSVP = "Repondez s'il vous plait", bukan "jawablah yang tidak perlu"
    {
        "content": "Jawablah dengan menuliskan YA atau TIDAK. Apakah RSVP berarti 'jawablah yang tidak perlu'?",
        "options": ["YA", "TIDAK"],
        "correct_index": 1  # TIDAK
    },
    # Q5 - pasukan/liga/pak/kelompok = kata benda grup. berpartisipasi = kata kerja
    {
        "content": "Dalam kelompok kata berikut, manakah kata yang berbeda dari kata yang lain?",
        "options": ["pasukan", "liga", "berpartisipasi", "pak", "kelompok"],
        "correct_index": 2  # berpartisipasi (kata kerja)
    },
    # Q6 - Biasa = common/usual -> lawan = jarang
    {
        "content": "BIASA adalah lawan kata dari...",
        "options": ["jarang", "terbiasa", "tetap", "berhenti", "selalu"],
        "correct_index": 0  # jarang
    },
    # Q7 - VISUAL - Full image question with image options
    {
        "content": "<img src='/images/logic/q7_question.png' class='question-image' />",
        "options": [
            "<img src='/images/logic/q7_option_a.png' class='option-image' />",
            "<img src='/images/logic/q7_option_b.png' class='option-image' />",
            "<img src='/images/logic/q7_option_c.png' class='option-image' />",
            "<img src='/images/logic/q7_option_d.png' class='option-image' />",
            "<img src='/images/logic/q7_option_e.png' class='option-image' />"
        ],
        "correct_index": 2  # C
    },
    # Q8 - 8->4->2->1->1/2->1/4->? Pola dibagi 2 -> 1/8
    {
        "content": "Perhatikan urutan angka berikut. Angka berapa yang selanjutnya muncul? 8  4  2  1  1/2  1/4  ?",
        "options": ["1/8", "1/6", "1/4", "1/10"],
        "correct_index": 0  # 1/8
    },
    # Q9 - Klien = Pelanggan (keduanya pengguna jasa/pembeli)
    {
        "content": "Klien dan Pelanggan. Apakah kata-kata ini:",
        "options": ["memiliki arti yang sama", "memiliki arti berlawanan", "tidak memiliki arti sama atau berlainan"],
        "correct_index": 0  # memiliki arti yang sama
    },
    # Q10 - Aroma saat mengunyah -> bau wangi
    {
        "content": "Manakah kata berikut ini yang berhubungan dengan aroma saat gigi mengunyah?",
        "options": ["manis", "bau tak sedap", "bau wangi", "hidung", "bersih"],
        "correct_index": 2  # bau wangi
    },
    # Q11 - Musim gugur <-> musim semi
    {
        "content": "MUSIM GUGUR adalah lawan dari:",
        "options": ["liburan", "musim panas", "musim semi", "musim dingin", "musim gugur"],
        "correct_index": 2  # musim semi
    },
    # Q12 - 300 kaki / 0.5 detik = 600 kaki/detik x 10 = 6000 kaki
    {
        "content": "Sebuah pesawat terbang 300 kaki dalam 1/2 detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?",
        "options": ["3.000 kaki", "4.500 kaki", "6.000 kaki", "9.000 kaki"],
        "correct_index": 2  # 6.000 kaki
    },
    # Q13 - Silogisme valid: lelaki->normal->aktif = BENAR
    {
        "content": "Anggaplah dua pernyataan pertama adalah benar. Apakah yang terakhir: Anak-anak lelaki ini adalah anak yang normal. Semua anak normal sifatnya aktif. Anak-anak lelaki ini aktif.",
        "options": ["benar", "salah", "tidak tahu"],
        "correct_index": 0  # benar
    },
    # Q14 - Jauh = far -> lawan = dekat
    {
        "content": "JAUH adalah lawan kata dari...",
        "options": ["terpencil", "dekat", "jauh", "terburu-buru", "pasti"],
        "correct_index": 1  # dekat
    },
    # Q15 - 1/2 lusin = 6 permen. 3 permen=10 -> 6 permen = 20 rupiah
    {
        "content": "3 permen lemon seharga 10 rupiah. Berapa harga 1/2 lusin?",
        "options": ["15 rupiah", "20 rupiah", "25 rupiah", "30 rupiah"],
        "correct_index": 1  # 20 rupiah
    },
    # Q16 - 84721=84721 dan 88884444=88884444 -> 2 pasang sama
    {
        "content": "<div class='comparison-table'><p>Berapa banyak duplikasi yang sama dari lima pasangan angka dibawah ini?</p><table><tr><td>84721</td><td>84721</td></tr><tr><td>9210651</td><td>9210561</td></tr><tr><td>14201201</td><td>14210210</td></tr><tr><td>96101101</td><td>96101161</td></tr><tr><td>88884444</td><td>88884444</td></tr></table></div>",
        "options": ["1", "2", "3", "4"],
        "correct_index": 1  # 2
    },
    # Q17 - Susun: "Suatu kalimat selalu memiliki sebuah kata kerja" -> kata terakhir "kerja" -> huruf terakhir 'a'
    {
        "content": "Misalkan Anda menyusun kata-kata berikut sehingga menjadi pernyataan yang benar. Lalu tuliskan huruf terakhir dari kata terakhir sebagai jawaban.\n[Selalu sebuah kata kerja kalimat suatu memiliki]",
        "options": ["a", "i", "u", "e"],
        "correct_index": 0  # 'a' dari kata "kerja"
    },
    # Q18 - Saudara = 2x5=10. Selisih usia = 5. Saat lelaki 8 -> saudara = 13
    {
        "content": "Anak lelaki berumur 5 tahun dan saudara perempuannya dua kali lebih tua. Ketika anak lelaki itu berumur 8 tahun, berapa umur saudara perempuannya?",
        "options": ["10 tahun", "11 tahun", "13 tahun", "16 tahun"],
        "correct_index": 2  # 13 tahun
    },
    # Q19 - IT'S = "it is". ITS = kepunyaan. Berbeda, bukan berlawanan
    {
        "content": "IT'S  ITS  Apakah kata ini:",
        "options": ["memiliki arti yang sama", "memiliki arti yang berlawanan", "tidak memiliki arti yang sama atau berlawanan"],
        "correct_index": 2  # tidak memiliki arti yang sama atau berlawanan
    },
    # Q20 - John=Sally<Bill -> John<Bill = BENAR (transitif)
    {
        "content": "Anggaplah dua pernyataan pertama adalah benar. Apakah pernyataan terakhir: John seusia dengan Sally. Sally lebih muda dari Bill. John lebih muda dari Bill.",
        "options": ["benar", "salah", "tidak tahu"],
        "correct_index": 0  # benar
    },
    # Q21 - Untung total = 1000. Per barrel = 50 -> 1000/50 = 20 barrel
    {
        "content": "Seorang dealer membeli beberapa barrel seharga 4.000 rupiah. Ia menjual dengan harga 5.000 rupiah, mendapat untung 50 rupiah setiap barrel. Berapa banyak barel yang dijual?",
        "options": ["10 barrel", "15 barrel", "20 barrel", "25 barrel"],
        "correct_index": 2  # 20 barrel
    },
    # Q22 - "semua ayam menghasilkan telur" -> SALAH (ayam jantan tidak bertelur)
    {
        "content": "Misalkan Anda menyusun kata-kata berikut sehingga menjadi kalimat lengkap. Jika kalimat itu benar, tulislah (B). Jika salah, tulislah (S).\n[telur menghasilkan semua ayam]",
        "options": ["B (Benar)", "S (Salah)"],
        "correct_index": 1  # S (Salah)
    },
    # Q23 - "Anak seperti Ayahnya" & "benih dari mangkuk yang sama" = sifat menurun dari asal-usul (SELECT 2 ANSWERS)
    {
        "content": "<p class='multi-select-instruction'>Pilih <strong>DUA (2)</strong> peribahasa yang memiliki arti sama.</p>Dua dari peribahasa berikut ini memiliki arti sama. Manakah itu?",
        "options": [
            "Semakin banyak memiliki sapi, akan memiliki satu anak sapi yang buruk.",
            "Anak seperti Ayahnya.",
            "Bila tertinggal sama jauhnya dengan satu mil",
            "Seorang dikenal dari persahabatan yang dijalin",
            "Mereka adalah benih dari mangkuk yang sama."
        ],
        "correct_index": [1, 4],  # Opsi 2 dan 5 (B and E) - user must select BOTH
        "multi_select": True  # Requires 2 selections
    },
    # Q24 - 78 detik / 39 hari = 2 detik/hari
    {
        "content": "Sebuah jam terlambat 1 menit 18 detik dalam 39 hari. Berapa detik ia terlambat dalam sehari?",
        "options": ["1 detik", "2 detik", "3 detik", "4 detik"],
        "correct_index": 1  # 2 detik
    },
    # Q25 - CANVASS = berkampanye/survei. CANVAS = kain kanvas. Berbeda, bukan berlawanan
    {
        "content": "CANVASS  CANVAS  Apakah kata-kata ini:",
        "options": ["memiliki arti yang sama", "memiliki arti yang berlawanan", "tidak memiliki arti sama atau berlawanan"],
        "correct_index": 2  # tidak memiliki arti sama atau berlawanan
    },
    # Q26 - Semua siswa->ujian. Beberapa orang=siswa -> beberapa orang->ujian = BENAR
    {
        "content": "Anggaplah dua pernyataan pertama adalah benar. Pernyataan terakhir: Semua siswa mengikuti ujian. Beberapa orang diruangan ini adalah siswa. Beberapa orang diruangan ini mengikuti ujian.",
        "options": ["benar", "salah", "tidak tahu"],
        "correct_index": 0  # benar
    },
    # Q27 - 1 dolar / 30 hari = 1/30 dolar per hari
    {
        "content": "Dalam 30 hari seorang menabung 1 dolar. Berapa rata-rata tabungannya setiap hari?",
        "options": ["1/10 dolar", "1/20 dolar", "1/30 dolar", "1/60 dolar"],
        "correct_index": 2  # 1/30 dolar
    },
    # Q28 - INGENIOUS = cerdas. INGENUOUS = polos/naif. Berbeda, bukan berlawanan
    {
        "content": "INGENIOUS  INGENUOUS  Apakah kata-kata ini:",
        "options": ["memiliki arti sama", "memiliki arti berlawanan", "tidak memiliki arti sama atau berlawanan"],
        "correct_index": 2  # tidak memiliki arti sama atau berlawanan
    },
    # Q29 - X=5Y, X+Y=36 -> 6Y=36 -> Y=6
    {
        "content": "Dua orang menangkap 36 ikan. X menangkap 5 kali lebih banyak dari Y. Berapa ikan yang ditangkap Y?",
        "options": ["4 ikan", "6 ikan", "8 ikan", "9 ikan"],
        "correct_index": 1  # 6 ikan
    },
    # Q30 - 800 = 10 x 8 x t -> t = 10 kaki
    {
        "content": "Sebuah kotak segi empat, yang terisi penuh, memuat 800 kubik kaki gandum. Jika satu kotak lebarnya 8 kaki dan panjangnya 10 kaki, berapa kedalaman kotak itu?",
        "options": ["8 kaki", "10 kaki", "12 kaki", "16 kaki"],
        "correct_index": 1  # 10 kaki
    },
    # Q31 - Pola: penyebut genap +2 (2,4,6,8,10,12). 1/9 penyebutnya ganjil -> tidak cocok
    {
        "content": "Satu angka dari rangkaian berikut tidak cocok dengan pola angka yang lainnya. Angka berapakah itu?\n1/2  1/4  1/6  1/8  1/9  1/12",
        "options": ["1/6", "1/8", "1/9", "1/12"],
        "correct_index": 2  # 1/9
    },
    # Q32 - P.M. = "post meridiem". Soal mengatakan "post merediem" (salah eja) -> TIDAK
    {
        "content": "Jawablah pertanyaan ini dengan menulis YA atau TIDAK. Apakah P.M. berarti 'post merediem'?",
        "options": ["YA", "TIDAK"],
        "correct_index": 1  # TIDAK (ejaan benar: "meridiem")
    },
    # Q33 - Dapat dipercaya = trustworthy. Gampang percaya = credulous. Berbeda, bukan berlawanan
    {
        "content": "DAPAT DIPERCAYA  GAMPANG PERCAYA  Apakah kata-kata ini:",
        "options": ["memiliki arti sama", "memiliki arti berlawanan", "tidak memiliki arti sama atau berlawanan"],
        "correct_index": 2  # tidak memiliki arti sama atau berlawanan
    },
    # Q34 - 45 / 2.25 = 20 potong
    {
        "content": "Sebuah rok membutuhkan 2 1/4 meter kain. Berapa banyak potong yang dihasilkan dari 45 meter kain?",
        "options": ["15 potong", "18 potong", "20 potong", "24 potong"],
        "correct_index": 2  # 20 potong
    },
    # Q35 - Senin 12.00 -> Rabu 14.00 = 50 jam. Rate = 26/50 det/jam. Dalam 0.5 jam = 0.26 detik
    {
        "content": "Sebuah jam menunjuk tepat pada pukul 12 siang hari pada hari Senin. Pada pukul 2 siang, hari Rabu, jam itu terlambat 26 detik. Pada rata-rata yang sama, berapa banyak jam itu terlambat dalam 1/2 jam?",
        "options": ["0.13 detik", "0.26 detik", "0.52 detik", "1.00 detik"],
        "correct_index": 1  # 0.26 detik
    },
    # Q36 - 9 = 3/8 x total -> total = 9 x 8/3 = 24
    {
        "content": "Tim bisbol kami kalah 9 permainan dalam musim ini. Ini merupakan 3/8 bagian dari semua pertandingan mereka. Berapa banyak pertandingan yang mereka mainkan dalam musim kompetisi saat ini?",
        "options": ["18 pertandingan", "21 pertandingan", "24 pertandingan", "27 pertandingan"],
        "correct_index": 2  # 24 pertandingan
    },
    # Q37 - Pola dibagi 2: 0.125 / 2 = 0.0625
    {
        "content": "Apakah angka selanjutnya dari seri ini? 1.0  0.50  0.25  0.125  ?",
        "options": ["0.100", "0.0625", "0.050", "0.025"],
        "correct_index": 1  # 0.0625
    },
    # Q38 - VISUAL - Cut line from point 10 to point 14
    {
        "content": "<p>Bentuk geometris ini dapat dibagi oleh suatu garis lurus menjadi dua bagian yang dapat disatukan dengan suatu cara hingga membentuk bujur sangkar yang sempurna. Gambarlah garis yang menghubungkan dua dari angka-angka yang ada. Lalu tuliskan angka tersebut sebagai jawaban.</p><img src='/images/logic/q38_question.png' class='question-image' />",
        "options": ["8 dan 12", "9 dan 13", "10 dan 14", "7 dan 11", "6 dan 12"],
        "correct_index": 2  # 10 dan 14
    },
    # Q39 - "Sapu baru" = baru lebih baik. "Sepatu lama makin lunak" = lama lebih baik -> berlawanan
    {
        "content": "Apakah arti dari kalimat berikut: Sebuah sapu yang baru menyapu dengan bersih. Sepatu yang sudah lama sifatnya makin lunak.",
        "options": ["sama", "berlawanan", "tidak sama atau berlawanan"],
        "correct_index": 1  # berlawanan
    },
    # Q40 - Hanya Wood=Wood yang sama -> 1 pasang
    {
        "content": "<div class='comparison-table'><p>Berapa duplikasi dari pasangan kata berikut ini?</p><table><tr><td>Rexford, J.D.</td><td>Rockford, J.D</td></tr><tr><td>Singleton, M.O.</td><td>Simbleten, M.O.</td></tr><tr><td>Richards, W.E.</td><td>Richad, W.E.</td></tr><tr><td>Siegel, A.B.</td><td>Seigel, A.B.</td></tr><tr><td>Wood, A.O.</td><td>Wood, A.O.</td></tr></table></div>",
        "options": ["0", "1", "2", "3"],
        "correct_index": 1  # 1
    },
    # Q41 - "Dompet sutra dari kuping babi" & "tidak bisa hancurkan kapal rusak" = mustahil dari bahan tidak memadai (SELECT 2 ANSWERS)
    {
        "content": "<p class='multi-select-instruction'>Pilih <strong>DUA (2)</strong> peribahasa yang memiliki makna serupa.</p>Dua dari peribahasa ini memiliki makna yang serupa. Manakah itu?",
        "options": [
            "Anda tidak dapat membuat dompet sutra dari kuping babi betina.",
            "Orang yang mencuri telur akan mencuri sapi.",
            "Batu yang berguling tidak akan mengumpulkan lumut.",
            "Anda tidak mungkin menghancurkan kapal yang sudah rusak.",
            "Ini ketidakmungkinan yang terjadi."
        ],
        "correct_index": [0, 3],  # Opsi 1 dan 4 (A and D) - user must select BOTH
        "multi_select": True  # Requires 2 selections
    },
    # Q42 - VISUAL - Cut line from point 3 to point 22
    {
        "content": "<p>Gambar geometris ini dapat dibagi dengan garis lurus menjadi dua bagian yang dapat disatukan untuk membentuk sebuah bujur sangkar yang sempurna.</p><img src='/images/logic/q42_question.png' class='question-image' />",
        "options": ["2 dan 21", "3 dan 22", "4 dan 23", "5 dan 18", "6 dan 19"],
        "correct_index": 1  # 3 dan 22
    },
    # Q43 - 10, 1, 0.999, 0.33, 11 -> terkecil = 0.33
    {
        "content": "Dalam kelompok angka berikut ini, manakah angka yang terkecil? 10  1  .999  .33  11",
        "options": ["10", "1", ".999", ".33", "11"],
        "correct_index": 3  # .33
    },
    # Q44 - Kedua kalimat: kejujuran itu positif/dihargai -> sama
    {
        "content": "Apakah makna dari kalimat berikut: Tidak ada orang jujur meminta maaf atas kejujurannya. Kejujuran dihormati dan lapar pujian.",
        "options": ["sama", "berlawanan", "tidak sama atau berlawanan"],
        "correct_index": 0  # sama
    },
    # Q45 - Beli 12 lusin=$1.80. Jual 10 lusin. Target jual=$1.80x4/3=$2.40. Per lusin=$2.40/10=$0.24
    {
        "content": "Dengan harga 1.80 dolar, seorang grosir membeli satu kardus buah yang berisi 12 lusin. Ia tahu dua lusin akan busuk sebelum dia menjualnya. Dengan harga berapa per lusin dia harus menjual jeruk itu untuk mendapat 1/3 dari harga seluruhnya?",
        "options": ["$0.18 per lusin", "$0.20 per lusin", "$0.24 per lusin", "$0.27 per lusin"],
        "correct_index": 2  # $0.24 per lusin
    },
    # Q46 - koloni/perkawanan/kawanan/kru = kumpulan makhluk hidup. konstelasi = kumpulan bintang
    {
        "content": "Dalam rangkaian kata berikut ini, manakah kata yang berbeda dari yang lainnya?",
        "options": ["koloni", "perkawanan", "kawanan", "kru", "konstelasi"],
        "correct_index": 4  # konstelasi
    },
    # Q47 - "Saya dibodohi" != "Saya orang besar" (fallacy affirming consequent) -> tidak tahu
    {
        "content": "Anggaplah dua pernyataan pertama ini benar. Apakah pertanyaan terakhir: Orang besar dibodohi. Saya dibodohi. Saya adalah orang besar.",
        "options": ["benar", "salah", "tidak tahu"],
        "correct_index": 2  # tidak tahu
    },
    # Q48 - Rata: X dapat $500. Proporsional: X = $1500x(4500/10000) = $675. Selisih = $175 lebih sedikit
    {
        "content": "Tiga orang membentuk kemitraan dan setuju membagi keuntungan secara rata. X menginvestasi 4.500 dolar. Y sebesar 3.500 dolar dan Z sebesar 2.000 dolar. Jika keuntungan mencapai 1.500 dolar, lebih kurang berapa yang akan diperoleh X dibanding jika keuntungan dibagi berdasarkan besarnya investasi?",
        "options": ["$75 lebih sedikit", "$125 lebih sedikit", "$175 lebih sedikit", "$225 lebih sedikit"],
        "correct_index": 2  # $175 lebih sedikit
    },
    # Q49 - VISUAL - Choose the piece that does NOT fit
    {
        "content": "<p>Empat dari 5 bagian ini dapat gabungkan untuk membuat segi tiga. Manakah gambar yang TIDAK digunakan?</p><img src='/images/logic/q49_question.png' class='question-image' />",
        "options": ["1", "2", "3", "4", "5"],
        "correct_index": 2  # C = 3 (the piece that doesn't fit)
    },
    # Q50 - 1500x + 1200(22-x) = 30000 -> 300x = 3600 -> x = 12 halaman tipe kecil
    {
        "content": "Untuk mencetak sebuah artikel berisi 30.000 kata, sebuah percetakan memutuskan untuk memakai dua ukuran jenis. Dengan menggunakan tipe yang lebih besar, sebuah halaman tercetak akan memuat 1.200 kata. Dengan tipe yang lebih kecil, sebuah halaman memuat 1.500 kata. Artikel ini masuk dalam 22 halaman di majalah. Berapa banyak halaman yang dibutuhkan untuk tipe yang lebih kecil?",
        "options": ["8 halaman", "10 halaman", "12 halaman", "14 halaman"],
        "correct_index": 2  # 12 halaman
    },
]

# 1. Find or create the test container
logic_test = db.query(Test).filter(Test.code == "LOGIC").first()

if not logic_test:
    logic_test = Test(
        name="Test IQ ( Aritmatika & Logika )",
        code="LOGIC",
        time_limit=720,  # 12 minutes
        settings={"type": "logic", "randomize_options": True}
    )
    db.add(logic_test)
    db.commit()
    db.refresh(logic_test)
    print("Created Logic & Arithmetic Test container with 12-minute timer.")
else:
    # Update timer to 12 minutes
    logic_test.time_limit = 720
    
    # Clear old data - need to delete in correct order due to foreign keys
    # First delete responses that reference ini test items
    old_qs = db.query(Question).filter(Question.test_id == logic_test.id).all()
    old_q_ids = [q.id for q in old_qs]
    
    if old_q_ids:
        # Delete responses, results and exit logs first (FK constraint)
        from models import Response, Result, ExitLog, Assignment
        db.query(Response).filter(Response.test_id == logic_test.id).delete(synchronize_session=False)
        db.query(Result).filter(Result.test_id == logic_test.id).delete(synchronize_session=False)
        db.query(ExitLog).filter(
            ExitLog.assignment_id.in_(
                db.query(Assignment.id).filter(Assignment.test_id == logic_test.id)
            )
        ).delete(synchronize_session=False)
        db.query(Assignment).filter(Assignment.test_id == logic_test.id).delete(synchronize_session=False)
        db.commit()
        
        # Delete options for old questions
        db.query(Option).filter(Option.question_id.in_(old_q_ids)).delete(synchronize_session=False)
        db.commit()
    
    # Now safe to delete old questions
    db.query(Question).filter(Question.test_id == logic_test.id).delete()
    db.commit()
    print("Cleared old Logic test data (including responses) and updated timer.")

# 2. Insert questions and options (shuffle options)
print("Seeding 50 Logic & Arithmetic questions...")
for idx, q_data in enumerate(questions_data, start=1):
    # Create question
    q = Question(
        test_id=logic_test.id,
        content=q_data["content"],
        order_index=idx
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Prepare options with correct flag
    options = q_data["options"]
    correct_index = q_data["correct_index"]
    is_multi_select = q_data.get("multi_select", False)
    
    # Store multi_select in question meta_data
    if is_multi_select:
        q.meta_data = {"multi_select": True}
        db.commit()
        print(f"  Question {idx}: multi_select enabled")

    # Handle multiple correct answers (Q23, Q41)
    if isinstance(correct_index, list):
        # Multiple correct answers - mark all specified indices as correct
        opt_list = [(opt, i in correct_index) for i, opt in enumerate(options)]
    else:
        # Single correct answer
        opt_list = [(opt, i == correct_index) for i, opt in enumerate(options)]

    # Shuffle options
    random.shuffle(opt_list)

    # Insert options with labels A, B, C, D, E...
    for j, (text, is_correct) in enumerate(opt_list):
        opt = Option(
            question_id=q.id,
            label=chr(65 + j),  # A, B, C, D, E...
            content=text,
            scoring_logic={"correct": is_correct}
        )
        db.add(opt)

db.commit()
print("Logic & Arithmetic test seeded successfully with 50 questions and 12-minute timer!")
db.close()
