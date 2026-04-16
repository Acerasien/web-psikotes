# server/seed_papi.py
"""
Seed PAPI Kostick (90 forced-choice items) into the LEAD test.
Replaces the old Leadership Test with PAPI Kostick.
"""
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

questions_data = [
    # Item 1
    {
        "statement_a": "Saya suka memimpin dalam diskusi kelompok",
        "norm_a": "L",
        "statement_b": "Saya senang membantu rekan kerja yang dalam kesulitan",
        "norm_b": "O",
    },
    # Item 2
    {
        "statement_a": "Saya memeriksa detail pekerjaan dengan teliti",
        "norm_a": "D",
        "statement_b": "Saya mengambil keputusan dengan cepat",
        "norm_b": "I",
    },
    # Item 3
    {
        "statement_a": "Saya berusaha menyelesaikan setiap tugas hingga tuntas",
        "norm_a": "N",
        "statement_b": "Saya menyukai tantangan dan hal-hal baru dalam pekerjaan",
        "norm_b": "Z",
    },
    # Item 4
    {
        "statement_a": "Saya mudah bergaul dan menikmati saat berinteraksi sosial",
        "norm_a": "S",
        "statement_b": "Saya akan bekerja keras untuk meraih hasil terbaik",
        "norm_b": "G",
    },
    # Item 5
    {
        "statement_a": "Saya merasa nyaman saat mengatur pekerjaan milik orang lain",
        "norm_a": "P",
        "statement_b": "Saya selalu mengikuti prosedur dan aturan yang ada",
        "norm_b": "W",
    },
    # Item 6
    {
        "statement_a": "Saya ingin dikenal dan diperhatikan oleh orang-orang di sekitar saya",
        "norm_a": "X",
        "statement_b": "Saya membutuhkan rasa memiliki dalam sebuah tim",
        "norm_b": "B",
    },
    # Item 7
    {
        "statement_a": "Saya menjaga kerapian dan keteraturan dalam bekerja",
        "norm_a": "C",
        "statement_b": "Saya lebih suka berpikir secara praktis dibanding teoritis",
        "norm_b": "R",
    },
    # Item 8
    {
        "statement_a": "Saya selalu merasa bersemangat dan berenergi dalam bekerja",
        "norm_a": "V",
        "statement_b": "Saya mampu mengontrol emosi saya dengan baik",
        "norm_b": "E",
    },
    # Item 9
    {
        "statement_a": "Saya senang mendorong diri sendiri untuk mencapai tujuan yang lebih tinggi",
        "norm_a": "A",
        "statement_b": "Saya mendukung dan menghormati otoritas atasan",
        "norm_b": "F",
    },
    # Item 10
    {
        "statement_a": "Saya bergerak cepat dalam menyelesaikan pekerjaan",
        "norm_a": "T",
        "statement_b": "Saya memiliki dorongan yang kuat untuk bersaing dan menang",
        "norm_b": "K",
    },
    # Item 11
    {
        "statement_a": "Saya bertanggung jawab penuh terhadap pekerjaan saya",
        "norm_a": "N",
        "statement_b": "Saya senang saat menjadi pusat perhatian dalam kelompok",
        "norm_b": "X",
    },
    # Item 12
    {
        "statement_a": "Saya suka menganalisis masalah secara mendalam",
        "norm_a": "R",
        "statement_b": "Saya membutuhkan dukungan dari atasan dalam bekerja",
        "norm_b": "W",
    },
    # Item 13
    {
        "statement_a": "Saya mudah mengambil keputusan walaupun berada dalam tekanan",
        "norm_a": "I",
        "statement_b": "Saya menjaga hubungan dekat dengan rekan kerja saya",
        "norm_b": "O",
    },
    # Item 14
    {
        "statement_a": "Saya terlibat aktif dalam kegiatan fisik dan olahraga",
        "norm_a": "V",
        "statement_b": "Saya senang saat menjadi bagian dari kelompok sosial",
        "norm_b": "B",
    },
    # Item 15
    {
        "statement_a": "Saya menetapkan standar tinggi untuk diri saya sendiri",
        "norm_a": "A",
        "statement_b": "Saya memiliki semangat kerja keras yang tinggi",
        "norm_b": "G",
    },
    # Item 16
    {
        "statement_a": "Saya suka memimpin dan mengarahkan tim",
        "norm_a": "L",
        "statement_b": "Saya memastikan setiap detail pekerjaan tidak akan terlewat",
        "norm_b": "D",
    },
    # Item 17
    {
        "statement_a": "Saya merasa perlu mengontrol jalannya sebuah proyek",
        "norm_a": "P",
        "statement_b": "Saya menikmati pekerjaan yang bervariasi dan penuh inovasi",
        "norm_b": "Z",
    },
    # Item 18
    {
        "statement_a": "Saya bekerja dengan tempo yang cepat dan penuh dengan semangat",
        "norm_a": "T",
        "statement_b": "Saya selalu berusaha mempertahankan hubungan harmonis di tempat kerja",
        "norm_b": "S",
    },
    # Item 19
    {
        "statement_a": "Saya mengutamakan keteraturan dan sistem dalam pekerjaan",
        "norm_a": "C",
        "statement_b": "Saya mudah bersikap tegas dan asertif apabila diperlukan",
        "norm_b": "K",
    },
    # Item 20
    {
        "statement_a": "Saya merasa nyaman bekerja tanpa adanya pengawasan ketat",
        "norm_a": "F",
        "statement_b": "Saya membutuhkan kasih sayang dan penerimaan dari orang lain",
        "norm_b": "O",
    },
    # Item 21
    {
        "statement_a": "Saya selalu ingin menyelesaikan pekerjaan yang saya mulai",
        "norm_a": "N",
        "statement_b": "Saya menyukai lingkungan kerja yang terstruktur dan jelas",
        "norm_b": "W",
    },
    # Item 22
    {
        "statement_a": "Saya menganggap kerja keras sebagai hal yang menyenangkan",
        "norm_a": "G",
        "statement_b": "Saya senang berdiskusi dan bertukar ide dengan orang lain",
        "norm_b": "B",
    },
    # Item 23
    {
        "statement_a": "Saya memiliki ambisi besar untuk terus maju dalam karier saya",
        "norm_a": "A",
        "statement_b": "Saya senang saat tampil di depan banyak orang",
        "norm_b": "X",
    },
    # Item 24
    {
        "statement_a": "Saya suka mengambil peran sebagai pemimpin dalam suatu tim",
        "norm_a": "L",
        "statement_b": "Biasanya saya menggunakan pendekatan analitis dalam memecahkan suatu masalah",
        "norm_b": "R",
    },
    # Item 25
    {
        "statement_a": "Saya merasa bertanggung jawab atas hasil kerja tim saya",
        "norm_a": "P",
        "statement_b": "Saya aktif secara fisik dan penuh energi",
        "norm_b": "V",
    },
    # Item 26
    {
        "statement_a": "Saya membuat keputusan berdasarkan pertimbangan yang matang",
        "norm_a": "I",
        "statement_b": "Saya selalu menjaga keseimbangan emosi dalam situasi-situasi sulit",
        "norm_b": "E",
    },
    # Item 27
    {
        "statement_a": "Saya selalu bekerja dengan kecepatan yang tinggi",
        "norm_a": "T",
        "statement_b": "Saya selalu memperhatikan detail kecil dalam pekerjaan saya",
        "norm_b": "D",
    },
    # Item 28
    {
        "statement_a": "Saya mudah menyesuaikan diri dengan perubahan",
        "norm_a": "Z",
        "statement_b": "Saya mendukung dan mematuhi arahan dari pimpinan",
        "norm_b": "F",
    },
    # Item 29
    {
        "statement_a": "Saya peduli pada perasaan dan kebutuhan orang lain",
        "norm_a": "O",
        "statement_b": "Saya memiliki dorongan yang kuat untuk meraih suatu prestasi",
        "norm_b": "A",
    },
    # Item 30
    {
        "statement_a": "Saya senang untuk membangun jaringan sosial yang luas",
        "norm_a": "S",
        "statement_b": "Saya berkomitmen untuk menyelesaikan setiap tugas",
        "norm_b": "N",
    },
    # Item 31
    {
        "statement_a": "Saya tipe yang bekerja keras tanpa mengeluh",
        "norm_a": "G",
        "statement_b": "Saya senang memimpin dan mengorganisir orang",
        "norm_b": "L",
    },
    # Item 32
    {
        "statement_a": "Saya menyukai pekerjaan yang memerlukan kecermatan yang tinggi",
        "norm_a": "D",
        "statement_b": "Saya berani untuk mengungkapkan pendapat saya secara tegas",
        "norm_b": "K",
    },
    # Item 33
    {
        "statement_a": "Saya merasa nyaman saat berada di situasi yang teratur dan terprediksi",
        "norm_a": "W",
        "statement_b": "Saya menyukai kebebasan dalam bekerja dan tanpa banyak aturan",
        "norm_b": "Z",
    },
    # Item 34
    {
        "statement_a": "Saya aktif mencari cara baru setiap menyelesaikan suatu masalah",
        "norm_a": "Z",
        "statement_b": "Saya merasa penting untuk diterima dalam suatu kelompok",
        "norm_b": "B",
    },
    # Item 35
    {
        "statement_a": "Saya cepat dalam merespons situasi yang memerlukan tindakan segera",
        "norm_a": "T",
        "statement_b": "Saya memilih untuk tidak terlalu menonjolkan diri sendiri secara sosial",
        "norm_b": "X",
    },
    # Item 36
    {
        "statement_a": "Saya senang berdebat dan berdiskusi untuk mencapai solusi terbaik",
        "norm_a": "K",
        "statement_b": "Saya menjaga hubungan baik dengan semua orang di tempat kerja",
        "norm_b": "O",
    },
    # Item 37
    {
        "statement_a": "Saya senang mengatur dan mengelola pekerjaan orang lain",
        "norm_a": "P",
        "statement_b": "Saya berusaha mempertimbangkan aspek teoritis dalam setiap pengambilan keputusan",
        "norm_b": "R",
    },
    # Item 38
    {
        "statement_a": "Saya merasa termotivasi saat mencapai target yang saya tetapkan",
        "norm_a": "A",
        "statement_b": "Saya menyukai rutinitas yang konsisten dalam bekerja",
        "norm_b": "W",
    },
    # Item 39
    {
        "statement_a": "Saya merasa energik dan bersemangat dalam setiap aktivitas",
        "norm_a": "V",
        "statement_b": "Saya merasa nyaman saat berinteraksi dengan banyak orang",
        "norm_b": "S",
    },
    # Item 40
    {
        "statement_a": "Saya membuat pilihan dengan percaya diri",
        "norm_a": "I",
        "statement_b": "Saya selalu menjaga area kerja saya tetap rapi dan teratur",
        "norm_b": "C",
    },
    # Item 41
    {
        "statement_a": "Saya tidak pernah meninggalkan pekerjaan yang belum selesai",
        "norm_a": "N",
        "statement_b": "Saya senang bekerja sama dalam sebuah tim",
        "norm_b": "B",
    },
    # Item 42
    {
        "statement_a": "Saya melihat bahwa kerja keras sebagai kunci kesuksesan",
        "norm_a": "G",
        "statement_b": "Saya mudah menyesuaikan diri dengan perubahan yang mendadak",
        "norm_b": "Z",
    },
    # Item 43
    {
        "statement_a": "Saya berani mengambil risiko dalam mengambil keputusan",
        "norm_a": "I",
        "statement_b": "Saya memerlukan arahan yang jelas dalam setiap pekerjaan",
        "norm_b": "W",
    },
    # Item 44
    {
        "statement_a": "Saya suka memperlihatkan kemampuan kepemimpinan saya",
        "norm_a": "L",
        "statement_b": "Saya peduli dengan detail dan akurasi dalam pekerjaan saya",
        "norm_b": "D",
    },
    # Item 45
    {
        "statement_a": "Saya merasa perlu diakui atas kontribusi saya",
        "norm_a": "X",
        "statement_b": "Saya mendukung kepemimpinan dengan cara saya sendiri",
        "norm_b": "F",
    },
    # Item 46
    {
        "statement_a": "Saya merespons secara emosional dengan cara yang terkontrol",
        "norm_a": "E",
        "statement_b": "Saya suka mendorong diri sendiri dan tim untuk lebih maju",
        "norm_b": "K",
    },
    # Item 47
    {
        "statement_a": "Saya sering berinisiatif dalam mengusulkan suatu perubahan",
        "norm_a": "Z",
        "statement_b": "Saya membutuhkan rasa aman dan keakraban dari rekan kerja",
        "norm_b": "O",
    },
    # Item 48
    {
        "statement_a": "Saya aktif secara fisik dan suka bergerak",
        "norm_a": "V",
        "statement_b": "Saya senang menganalisis data secara mendalam",
        "norm_b": "R",
    },
    # Item 49
    {
        "statement_a": "Saya selalu menargetkan hasil yang melebihi ekspektasi",
        "norm_a": "A",
        "statement_b": "Saya menjaga sistem dan prosedur dalam bekerja",
        "norm_b": "C",
    },
    # Item 50
    {
        "statement_a": "Saya nyaman memimpin rapat dan presentasi",
        "norm_a": "L",
        "statement_b": "Saya memperhatikan kebutuhan emosional rekan kerja",
        "norm_b": "O",
    },
    # Item 51
    {
        "statement_a": "Saya bekerja dengan antusias dan penuh semangat",
        "norm_a": "G",
        "statement_b": "Saya memilih tugas yang memungkinkan saya berinteraksi banyak",
        "norm_b": "S",
    },
    # Item 52
    {
        "statement_a": "Saya suka mengambil kendali atas situasi",
        "norm_a": "P",
        "statement_b": "Saya memperhatikan hal-hal kecil yang sering diabaikan orang lain",
        "norm_b": "D",
    },
    # Item 53
    {
        "statement_a": "Saya bertindak cepat dan tidak suka menunda pekerjaan",
        "norm_a": "T",
        "statement_b": "Saya merasa perlu diakui sebagai bagian dari kelompok",
        "norm_b": "B",
    },
    # Item 54
    {
        "statement_a": "Saya senang bekerja dengan pola pikir yang sistematis",
        "norm_a": "R",
        "statement_b": "Saya memiliki keyakinan kuat untuk mencapai tujuan saya",
        "norm_b": "A",
    },
    # Item 55
    {
        "statement_a": "Saya lebih suka bekerja sesuai prosedur yang ada",
        "norm_a": "W",
        "statement_b": "Saya memiliki semangat bersaing yang tinggi",
        "norm_b": "K",
    },
    # Item 56
    {
        "statement_a": "Saya tidak mudah terpengaruh oleh emosi dalam bekerja",
        "norm_a": "E",
        "statement_b": "Saya selalu berusaha menyelesaikan tugas yang diberikan",
        "norm_b": "N",
    },
    # Item 57
    {
        "statement_a": "Saya menikmati menjadi tokoh sentral atau utama dalam suatu acara",
        "norm_a": "X",
        "statement_b": "Saya senang bergerak aktif dan terlibat secara fisik",
        "norm_b": "V",
    },
    # Item 58
    {
        "statement_a": "Saya selalu menempatkan kebutuhan pimpinan di atas kepentingan pribadi",
        "norm_a": "F",
        "statement_b": "Saya senang dapat memberikan solusi inovatif dalam pekerjaan",
        "norm_b": "Z",
    },
    # Item 59
    {
        "statement_a": "Saya mudah membangun kepercayaan dengan orang baru",
        "norm_a": "S",
        "statement_b": "Saya bekerja dengan teliti dan hati-hati",
        "norm_b": "D",
    },
    # Item 60
    {
        "statement_a": "Saya tidak ragu mengambil keputusan sulit",
        "norm_a": "I",
        "statement_b": "Saya senang terlibat dalam kegiatan kelompok",
        "norm_b": "B",
    },
    # Item 61
    {
        "statement_a": "Saya memiliki jadwal kerja yang teratur dan konsisten",
        "norm_a": "C",
        "statement_b": "Saya memiliki semangat tinggi dalam meraih prestasi",
        "norm_b": "A",
    },
    # Item 62
    {
        "statement_a": "Saya cepat bereaksi terhadap perubahan situasi",
        "norm_a": "T",
        "statement_b": "Saya mematuhi instruksi dari atasan dengan baik",
        "norm_b": "F",
    },
    # Item 63
    {
        "statement_a": "Saya suka mengelola tim dan mendistribusikan tugas-tugas ke anggota tim",
        "norm_a": "P",
        "statement_b": "Saya mudah terhubung secara emosional dengan orang lain",
        "norm_b": "O",
    },
    # Item 64
    {
        "statement_a": "Saya berpikir abstrak dan konseptual setiap menghadapi masalah",
        "norm_a": "R",
        "statement_b": "Saya aktif dalam kegiatan yang melibatkan banyak orang",
        "norm_b": "S",
    },
    # Item 65
    {
        "statement_a": "Saya selalu bersemangat menghadapi tantangan baru",
        "norm_a": "Z",
        "statement_b": "Saya selalu memastikan bahwa pekerjaan saya bebas dari kesalahan",
        "norm_b": "D",
    },
    # Item 66
    {
        "statement_a": "Saya selalu memperlihatkan semangat tinggi dalam setiap kegiatan",
        "norm_a": "V",
        "statement_b": "Saya tidak terlalu bergantung pada persetujuan orang lain",
        "norm_b": "C",
    },
    # Item 67
    {
        "statement_a": "Saya berani menghadapi konflik demi hasil yang lebih baik",
        "norm_a": "K",
        "statement_b": "Saya membutuhkan bimbingan dari atasan dalam situasi yang baru untuk saya",
        "norm_b": "W",
    },
    # Item 68
    {
        "statement_a": "Saya berkomitment kuat terhadap pekerjaan yang saya emban",
        "norm_a": "N",
        "statement_b": "Saya senang bersosialisasi di luar konteks pekerjaan",
        "norm_b": "B",
    },
    # Item 69
    {
        "statement_a": "Saya merasa puas saat bekerja keras dan hasilnya nyata",
        "norm_a": "G",
        "statement_b": "Saya bisa tetap tenang meski berada di bawah tekanan",
        "norm_b": "E",
    },
    # Item 70
    {
        "statement_a": "Saya memimpin dengan memberikan contoh langsung",
        "norm_a": "L",
        "statement_b": "Saya memiliki pendekatan yang logis dan terstruktur",
        "norm_b": "R",
    },
    # Item 71
    {
        "statement_a": "Saya suka mengatur dan merapikan lingkungan kerja saya",
        "norm_a": "C",
        "statement_b": "Saya suka tantangan dan tidak takut menghadapi risiko",
        "norm_b": "K",
    },
    # Item 72
    {
        "statement_a": "Saya cepat dalam memroses informasi dan mengambil tindakan",
        "norm_a": "T",
        "statement_b": "Saya mendorong orang lain untuk mencapai potensi terbaik mereka",
        "norm_b": "P",
    },
    # Item 73
    {
        "statement_a": "Saya selalu mengikuti aturan yang berlaku di tempat kerja",
        "norm_a": "W",
        "statement_b": "Saya percaya diri dalam situasi sosial yang baru untuk saya",
        "norm_b": "S",
    },
    # Item 74
    {
        "statement_a": "Saya ambisius dan selalu ingin berkembang lebih jauh",
        "norm_a": "A",
        "statement_b": "Saya nyaman bekerja secara mandiri tanpa banyak arahan",
        "norm_b": "F",
    },
    # Item 75
    {
        "statement_a": "Saya peduli pada detail sekecil apapun dalam pekerjaan",
        "norm_a": "D",
        "statement_b": "Saya menyukai perubahan dan variasi dalam rutinitas kerja",
        "norm_b": "Z",
    },
    # Item 76
    {
        "statement_a": "Saya suka bekerja keras dan tidak mudah menyerah",
        "norm_a": "G",
        "statement_b": "Saya menjaga keseimbangan antara emosi dan logika",
        "norm_b": "E",
    },
    # Item 77
    {
        "statement_a": "Saya menikmati menjadi pusat diskusi dan pengambilan keputusan",
        "norm_a": "L",
        "statement_b": "Saya mudah bersimpati dan berempati kepada orang lain",
        "norm_b": "O",
    },
    # Item 78
    {
        "statement_a": "Saya merasa perlu mengontrol setiap aspek pekerjaan saya",
        "norm_a": "P",
        "statement_b": "Saya aktif mencari peluang untuk berkembang dan berinovasi",
        "norm_b": "Z",
    },
    # Item 79
    {
        "statement_a": "Saya bergerak dengan cepat dan tidak suka diam",
        "norm_a": "T",
        "statement_b": "Saya merasa tidak nyaman menjadi sorotan publik",
        "norm_b": "X",
    },
    # Item 80
    {
        "statement_a": "Saya bersikap asertif dan tegas dalam menyampaikan pendapat",
        "norm_a": "K",
        "statement_b": "Saya merasa perlu diterima secara sosial dalam kelompok",
        "norm_b": "B",
    },
    # Item 81
    {
        "statement_a": "Saya tidak suka meninggalkan pekerjaan setengah jalan",
        "norm_a": "N",
        "statement_b": "Saya lebih menyukai bekerja dalam tim yang solid",
        "norm_b": "S",
    },
    # Item 82
    {
        "statement_a": "Saya menikmati bekerja keras dan merasa bangga dengannya",
        "norm_a": "G",
        "statement_b": "Saya mengambil keputusan berdasarkan fakta dan data",
        "norm_b": "I",
    },
    # Item 83
    {
        "statement_a": "Saya menargetkan kesuksesan jangka panjang dalam karier",
        "norm_a": "A",
        "statement_b": "Saya menghindari konflik dan berusaha menjaga keharmonisan",
        "norm_b": "E",
    },
    # Item 84
    {
        "statement_a": "Saya suka mengelola dan mendelegasikan pekerjaan kepada tim",
        "norm_a": "P",
        "statement_b": "Saya mengikuti prosedur baku dalam menyelesaikan pekerjaan",
        "norm_b": "W",
    },
    # Item 85
    {
        "statement_a": "Saya menikmati tantangan fisik dan aktif bergerak",
        "norm_a": "V",
        "statement_b": "Saya menghargai dan mendukung otoritas yang ada",
        "norm_b": "F",
    },
    # Item 86
    {
        "statement_a": "Saya memiliki cara kerja yang metodis dan sistematis",
        "norm_a": "C",
        "statement_b": "Saya merasa nyaman saat tampil di depan umum",
        "norm_b": "X",
    },
    # Item 87
    {
        "statement_a": "Saya memperhatikan setiap instruksi dengan seksama",
        "norm_a": "D",
        "statement_b": "Saya merasa bersemangat saat memulai proyek-proyek baru",
        "norm_b": "Z",
    },
    # Item 88
    {
        "statement_a": "Saya selalu siap mengambil tanggung jawab atas keputusan saya",
        "norm_a": "I",
        "statement_b": "Saya menyukai suasana kerja yang hangat dan penuh kebersamaan",
        "norm_b": "B",
    },
    # Item 89
    {
        "statement_a": "Saya tidak mudah terpancing emosi oleh situasi yang menekan",
        "norm_a": "E",
        "statement_b": "Saya mendorong tim untuk bekerja lebih keras dan lebih baik",
        "norm_b": "K",
    },
    # Item 90
    {
        "statement_a": "Saya lebih suka bekerja secara mandiri daripada bergantung pada orang lain",
        "norm_a": "R",
        "statement_b": "Saya membangun hubungan sosial yang tulus dan bermakna",
        "norm_b": "S",
    },
]

# 1. Find or create the test container
papi_test = db.query(Test).filter(Test.code == "LEAD").first()

if not papi_test:
    papi_test = Test(
        name="Test Kepemimpinan",
        code="LEAD",
        time_limit=300,  # 20 minutes
        settings={"type": "papi_kostick", "format": "forced_choice"}
    )
    db.add(papi_test)
    db.commit()
    db.refresh(papi_test)
    print("Created PAPI Kostick Test container (90 items, 20 min).")
else:
    # Clear old data and update settings
    papi_test.name = "Test Kepemimpinan"
    papi_test.time_limit = 300
    papi_test.settings = {"type": "papi_kostick", "format": "forced_choice"}
    old_qs = db.query(Question).filter(Question.test_id == papi_test.id).all()
    old_q_ids = [q.id for q in old_qs]

    if old_q_ids:
        # Delete responses, results and exit logs first (FK constraint)
        from models import Response, Result, ExitLog, Assignment
        db.query(Response).filter(Response.test_id == papi_test.id).delete(synchronize_session=False)
        db.query(Result).filter(Result.test_id == papi_test.id).delete(synchronize_session=False)
        db.query(ExitLog).filter(
            ExitLog.assignment_id.in_(
                db.query(Assignment.id).filter(Assignment.test_id == papi_test.id)
            )
        ).delete(synchronize_session=False)
        db.query(Assignment).filter(Assignment.test_id == papi_test.id).delete(synchronize_session=False)
        db.commit()

        # Then delete options
        db.query(Option).filter(Option.question_id.in_(old_q_ids)).delete(synchronize_session=False)
        db.commit()

    db.query(Question).filter(Question.test_id == papi_test.id).delete()
    db.commit()
    print(f"Cleared old Leadership data. Seeding PAPI Kostick Test (90 items).")

print(f"Seeding {len(questions_data)} PAPI Kostick forced-choice items...")

for idx, item in enumerate(questions_data):
    q = Question(
        test_id=papi_test.id,
        content="Pilih SATU pernyataan yang paling sesuai dengan diri Anda.",
        order_index=idx + 1,
        meta_data={
            "type": "papi_forced_choice",
            "statement_a": item["statement_a"],
            "statement_b": item["statement_b"],
        }
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Create 2 options: A and B
    # Option A
    opt_a = Option(
        question_id=q.id,
        label="A",
        content=item["statement_a"],
        scoring_logic={"norm": item["norm_a"]}
    )
    db.add(opt_a)

    # Option B
    opt_b = Option(
        question_id=q.id,
        label="B",
        content=item["statement_b"],
        scoring_logic={"norm": item["norm_b"]}
    )
    db.add(opt_b)

    if (idx + 1) % 18 == 0:
        print(f"  Seeded {idx + 1}/{len(questions_data)} items...")

db.commit()

# Verify
total_qs = db.query(Question).filter(Question.test_id == papi_test.id).count()
total_opts = db.query(Option).join(Question).filter(Question.test_id == papi_test.id).count()

print(f"\nSuccessfully seeded PAPI Kostick Test!")
print(f"   - Total questions: {total_qs} (expected: 90)")
print(f"   - Total options: {total_opts} (expected: 180)")
print(f"   - Test code: LEAD")
print(f"   - Time limit: {papi_test.time_limit}s ({papi_test.time_limit // 60} min)")

db.close()
