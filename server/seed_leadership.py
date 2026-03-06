# server/seed_leadership.py
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# Define traits with codes
traits = {
    "DEC": "Decisiveness",
    "COM": "Communication",
    "STR": "Strategic Thinking",
    "TEA": "Team Orientation",
    "ACC": "Accountability",
    "EMO": "Emotional Control"
}

# 1. Find or create the test container
lead_test = db.query(Test).filter(Test.code == "LEAD").first()

if not lead_test:
    lead_test = Test(
    name="Leadership Test",
    code="LEAD",
    time_limit=420,  # 7 minutes
    settings={"type": "leadership", "randomize_options": True}
)
    db.add(lead_test)
    db.commit()
    db.refresh(lead_test)
    print("Created Leadership Test container (20 questions).")
else:
    # Clear old data and update settings
    lead_test.time_limit = 0
    lead_test.settings = {"type": "leadership", "randomize_options": True}
    old_qs = db.query(Question).filter(Question.test_id == lead_test.id).all()
    for q in old_qs:
        db.query(Option).filter(Option.question_id == q.id).delete()
    db.query(Question).filter(Question.test_id == lead_test.id).delete()
    db.commit()
    print("Cleared old Leadership data.")

# 2. Define 20 Indonesian workplace scenarios and options with trait contributions
# Each option is a dict: "text": ..., "traits": {trait_code: points}
questions_data = [

{
"scenario": "Tim Anda sedang mengejar tenggat waktu proyek yang sangat ketat. Tiba-tiba salah satu anggota tim mengajukan cuti mendadak karena masalah keluarga. Sebagai pemimpin, apa yang Anda lakukan?",
"options": [
{"text": "Sementara mengambil alih tugas anggota tersebut agar proyek tetap berjalan sesuai jadwal.", "traits": {"DEC": 3, "ACC": 2}},
{"text": "Mengajak tim berdiskusi untuk membagi ulang tugas secara adil.", "traits": {"COM": 3, "TEA": 2}},
{"text": "Mencari anggota tim lain yang masih memiliki waktu untuk membantu mengambil sebagian tugas.", "traits": {"TEA": 2, "COM": 1}},
{"text": "Meminta anggota tersebut menunda cutinya sampai proyek selesai.", "traits": {"DEC": 2, "EMO": -1}}
]
},

{
"scenario": "Salah satu anggota tim yang biasanya berkinerja baik mulai sering datang terlambat selama dua minggu terakhir. Meski pekerjaannya masih baik, Anda khawatir hal ini dapat memengaruhi tim. Bagaimana Anda merespons?",
"options": [
{"text": "Mengajaknya berbicara secara pribadi untuk memahami penyebabnya.", "traits": {"COM": 3, "EMO": 2}},
{"text": "Memberikan teguran formal sesuai aturan perusahaan.", "traits": {"DEC": 2, "ACC": 2}},
{"text": "Memantau situasinya selama kinerjanya masih baik.", "traits": {"EMO": 1, "ACC": -1}},
{"text": "Mengingatkan seluruh tim tentang kedisiplinan dalam rapat tim.", "traits": {"COM": 2, "TEA": 1, "DEC": 1}}
]
},

{
"scenario": "Departemen Anda harus memilih satu dari dua proyek jangka panjang yang sama-sama menjanjikan. Karena sumber daya terbatas, hanya satu yang bisa dijalankan. Bagaimana Anda mengambil keputusan?",
"options": [
{"text": "Menganalisis potensi keuntungan, risiko, dan dampaknya bagi perusahaan.", "traits": {"STR": 3, "DEC": 1}},
{"text": "Mengumpulkan pendapat tim melalui diskusi sebelum mengambil keputusan.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Mengandalkan pengalaman dan intuisi untuk memutuskan dengan cepat.", "traits": {"DEC": 2, "STR": 1}},
{"text": "Menunda keputusan sampai mendapatkan informasi tambahan.", "traits": {"EMO": 2, "STR": -1}}
]
},

{
"scenario": "Dalam rapat tim, seorang anggota secara terbuka tidak setuju dengan keputusan Anda dan menyampaikannya dengan cukup tegas. Bagaimana Anda menanggapinya?",
"options": [
{"text": "Mendengarkan pendapatnya dengan tenang lalu merespons berdasarkan fakta.", "traits": {"EMO": 3, "COM": 2}},
{"text": "Menghentikan diskusi dan menegaskan bahwa keputusan sudah final.", "traits": {"DEC": 2, "EMO": -1}},
{"text": "Menunda pembahasan dan mengajaknya berdiskusi setelah rapat.", "traits": {"COM": 2, "EMO": 2}},
{"text": "Meminta pendapat anggota tim lain untuk mendapatkan sudut pandang tambahan.", "traits": {"TEA": 3, "COM": 1}}
]
},

{
"scenario": "Anda melihat adanya konflik pribadi antara dua anggota tim yang mulai memengaruhi kerja sama mereka. Apa yang Anda lakukan?",
"options": [
{"text": "Berbicara dengan masing-masing secara terpisah untuk memahami masalahnya.", "traits": {"COM": 3, "EMO": 2}},
{"text": "Mempertemukan keduanya dan memfasilitasi diskusi untuk mencari solusi.", "traits": {"DEC": 2, "COM": 2}},
{"text": "Menyesuaikan pembagian tugas sementara agar interaksi mereka berkurang.", "traits": {"STR": 2, "TEA": 1}},
{"text": "Membiarkan mereka menyelesaikannya sendiri selama pekerjaan tetap berjalan.", "traits": {"EMO": -1, "ACC": -1}}
]
},

{
"scenario": "Perusahaan meminta tim Anda mengurangi biaya operasional sebesar 15%. Apa langkah pertama yang Anda ambil?",
"options": [
{"text": "Mengajak tim berdiskusi untuk mencari area yang bisa dihemat.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Menganalisis setiap pos anggaran untuk menentukan prioritas pemotongan.", "traits": {"STR": 3, "DEC": 2}},
{"text": "Memotong semua pos anggaran secara proporsional tanpa diskusi.", "traits": {"DEC": 2, "TEA": -2}},
{"text": "Bekerja sama dengan tim mencari solusi penghematan yang tidak mengganggu operasional.", "traits": {"COM": 2, "TEA": 2, "STR": 1}}
]
},

{
"scenario": "Seorang anggota tim mengusulkan ide inovatif yang menarik, tetapi Anda melihat risikonya cukup tinggi. Apa yang Anda lakukan?",
"options": [
{"text": "Mendukung ide tersebut dengan syarat ada analisis risiko yang jelas.", "traits": {"STR": 2, "ACC": 2, "COM": 1}},
{"text": "Menolak ide tersebut karena risikonya terlalu besar.", "traits": {"DEC": 2, "EMO": -1}},
{"text": "Mengajak tim mengevaluasi ide tersebut bersama.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Memberikan kesempatan uji coba dalam skala kecil.", "traits": {"DEC": 2, "STR": 2}}
]
},

{
"scenario": "Anda menerima umpan balik dari atasan tentang area yang perlu diperbaiki dalam kinerja tim. Bagaimana Anda menyampaikannya kepada tim?",
"options": [
{"text": "Menyampaikan umpan balik secara terbuka dengan fokus pada solusi.", "traits": {"COM": 3, "ACC": 2}},
{"text": "Menjelaskan secara spesifik bagian mana yang perlu ditingkatkan.", "traits": {"ACC": 1, "EMO": -1}},
{"text": "Mengajak tim berdiskusi untuk menyusun rencana perbaikan bersama.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Menyampaikan hanya poin yang paling relevan bagi tim.", "traits": {"EMO": 1, "ACC": -1}}
]
},

{
"scenario": "Sebuah proyek penting mengalami kemunduran karena kesalahan teknis dari salah satu anggota tim. Bagaimana Anda menanganinya?",
"options": [
{"text": "Berbicara langsung dengannya untuk memahami penyebabnya dan mencari solusi.", "traits": {"COM": 3, "ACC": 2}},
{"text": "Mengikuti prosedur disiplin sesuai kebijakan perusahaan.", "traits": {"DEC": 2, "ACC": 2}},
{"text": "Fokus pada perbaikan ke depan tanpa membahas kesalahan terlalu jauh.", "traits": {"EMO": 1, "ACC": -1}},
{"text": "Mengajak tim melakukan evaluasi bersama agar kejadian serupa tidak terulang.", "traits": {"STR": 2, "TEA": 2}}
]
},

{
"scenario": "Tim Anda terdiri dari orang dengan latar belakang dan gaya kerja yang berbeda-beda. Bagaimana Anda membangun kekompakan?",
"options": [
{"text": "Mengadakan kegiatan team building secara berkala.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Menetapkan aturan dan ekspektasi kerja yang jelas sejak awal.", "traits": {"DEC": 2, "STR": 1}},
{"text": "Memberi kebebasan selama target kerja tercapai.", "traits": {"EMO": 2, "TEA": 1}},
{"text": "Mendorong dialog terbuka agar anggota tim saling memahami.", "traits": {"COM": 3, "EMO": 2}}
]
},

{
"scenario": "Anda menghadapi tugas mendesak. Anda bisa mengerjakannya sendiri atau mendelegasikannya kepada anggota tim yang sudah cukup sibuk. Apa yang Anda lakukan?",
"options": [
{"text": "Mengerjakan tugas tersebut sendiri agar selesai dengan cepat.", "traits": {"DEC": 3, "ACC": 2}},
{"text": "Mendelegasikannya dengan arahan dan dukungan yang jelas.", "traits": {"COM": 2, "TEA": 2}},
{"text": "Mencari anggota tim lain yang masih memiliki kapasitas.", "traits": {"STR": 2, "TEA": 1}},
{"text": "Menunda tugas sampai kapasitas tim lebih memungkinkan.", "traits": {"EMO": 1, "DEC": -2}}
]
},

{
"scenario": "Anda melihat salah satu anggota tim tampak kehilangan motivasi. Kinerjanya menurun dan ia mulai sering absen. Bagaimana Anda mendekatinya?",
"options": [
{"text": "Mengajaknya berbicara secara pribadi dengan pendekatan empatik.", "traits": {"COM": 3, "EMO": 2}},
{"text": "Memberikan peringatan formal sesuai prosedur.", "traits": {"DEC": 2, "ACC": 1}},
{"text": "Memberinya tantangan atau tugas baru agar kembali termotivasi.", "traits": {"STR": 2, "EMO": -1}},
{"text": "Memantau situasinya sambil memberi ruang.", "traits": {"EMO": -1, "TEA": -1}}
]
},

{
"scenario": "Atasan menunjuk Anda untuk memimpin proyek lintas departemen dengan tenggat waktu sangat ketat. Apa langkah pertama Anda?",
"options": [
{"text": "Menyusun rencana kerja yang jelas dan realistis.", "traits": {"DEC": 2, "STR": 2}},
{"text": "Menegosiasikan tenggat waktu berdasarkan analisis kapasitas tim.", "traits": {"COM": 3, "STR": 2}},
{"text": "Meminta klarifikasi prioritas proyek kepada atasan.", "traits": {"DEC": 2, "COM": 1}},
{"text": "Mengonsultasikan rencana awal dengan semua pihak terkait.", "traits": {"TEA": 3, "COM": 1}}
]
},

{
"scenario": "Tim Anda baru saja menyelesaikan proyek besar dengan hasil yang sangat baik. Bagaimana Anda merayakan keberhasilan ini?",
"options": [
{"text": "Mengadakan acara apresiasi untuk tim.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Memberikan penghargaan berdasarkan kontribusi masing-masing.", "traits": {"ACC": 2, "DEC": 1}},
{"text": "Mengumumkan keberhasilan tim dalam forum yang lebih luas.", "traits": {"COM": 2, "TEA": 1}},
{"text": "Langsung fokus ke target berikutnya.", "traits": {"STR": 1, "EMO": -1}}
]
},

{
"scenario": "Seorang anggota tim meminta promosi, tetapi menurut Anda ia belum memenuhi kriteria. Bagaimana Anda merespons?",
"options": [
{"text": "Memberikan umpan balik jujur dan membantu menyusun rencana pengembangan.", "traits": {"COM": 3, "ACC": 2}},
{"text": "Menjelaskan alasan penolakan secara langsung.", "traits": {"DEC": 2, "ACC": 1}},
{"text": "Memberinya kesempatan untuk mencoba lagi pada periode berikutnya.", "traits": {"COM": 1, "EMO": 2}},
{"text": "Mendiskusikan kasus ini terlebih dahulu dengan HR atau atasan.", "traits": {"STR": 2, "ACC": 1}}
]
},

{
"scenario": "Anda mendengar rumor yang belum tentu benar dan berpotensi menurunkan moral tim. Apa yang Anda lakukan?",
"options": [
{"text": "Mengklarifikasi informasi tersebut secara terbuka.", "traits": {"COM": 3, "TEA": 2}},
{"text": "Memantau situasi tanpa bereaksi berlebihan.", "traits": {"EMO": 1, "STR": 1}},
{"text": "Mencari sumber rumor dan menanganinya secara profesional.", "traits": {"DEC": 2, "COM": 1}},
{"text": "Memperkuat komunikasi internal agar tim tidak mudah terpengaruh rumor.", "traits": {"STR": 2, "TEA": 2}}
]
},

{
"scenario": "Tim Anda harus bekerja lembur intensif selama satu bulan ke depan. Bagaimana Anda menjaga semangat mereka?",
"options": [
{"text": "Memastikan ada kompensasi dan apresiasi yang adil.", "traits": {"ACC": 3, "TEA": 2}},
{"text": "Menjelaskan pentingnya pekerjaan ini bagi tujuan tim.", "traits": {"COM": 2, "STR": 2}},
{"text": "Turun langsung bekerja bersama tim.", "traits": {"TEA": 3, "EMO": 1}},
{"text": "Mengatur rotasi kerja dan waktu istirahat agar tidak kelelahan.", "traits": {"STR": 3, "ACC": 1}}
]
},

{
"scenario": "Anda merasa kebijakan baru perusahaan kurang mendukung efektivitas tim Anda. Apa yang Anda lakukan?",
"options": [
{"text": "Menyusun proposal alternatif berbasis data.", "traits": {"STR": 3, "COM": 2}},
{"text": "Menyampaikan masukan langsung kepada pembuat kebijakan.", "traits": {"DEC": 2, "ACC": 1}},
{"text": "Mengumpulkan masukan tim untuk memperkuat argumen.", "traits": {"TEA": 3, "COM": 2}},
{"text": "Tetap menjalankan kebijakan sambil meminimalkan dampaknya.", "traits": {"EMO": 1, "ACC": -1}}
]
},

{
"scenario": "Salah satu anggota tim yang pendiam jarang berbicara dalam diskusi, padahal Anda yakin ia memiliki ide yang bagus. Bagaimana Anda mendorong partisipasinya?",
"options": [
{"text": "Memberi kesempatan khusus baginya untuk berbicara.", "traits": {"COM": 2, "EMO": 2}},
{"text": "Mengajaknya berdiskusi secara pribadi terlebih dahulu.", "traits": {"COM": 3, "TEA": 1}},
{"text": "Memberinya peran yang memanfaatkan keahliannya.", "traits": {"STR": 2, "TEA": 2}},
{"text": "Menghormati gaya komunikasinya tanpa memaksanya berbicara.", "traits": {"EMO": 1, "TEA": -1}}
]
},

{
"scenario": "Tim Anda gagal mencapai target kuartalan. Bagaimana Anda memimpin evaluasi agar tetap konstruktif?",
"options": [
{"text": "Mengadakan sesi refleksi terbuka untuk belajar dari kesalahan.", "traits": {"COM": 3, "ACC": 2}},
{"text": "Menganalisis data kinerja lalu memberi arahan perbaikan.", "traits": {"STR": 3, "DEC": 2}},
{"text": "Meminta setiap anggota melakukan refleksi pribadi.", "traits": {"ACC": 2, "EMO": 1}},
{"text": "Membentuk tim kecil untuk merancang strategi perbaikan.", "traits": {"TEA": 2, "STR": 2}}
]
}

]

assert len(questions_data) == 20

# 3. Insert questions and options (shuffle options)
print("Seeding 20 Leadership questions...")
for idx, q_data in enumerate(questions_data, start=1):
    q = Question(
        test_id=lead_test.id,
        content=q_data["scenario"],
        order_index=idx
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Create options list
    opt_list = q_data["options"]
    random.shuffle(opt_list)
    for j, opt in enumerate(opt_list):
        new_opt = Option(
            question_id=q.id,
            label=chr(65 + j),  # A, B, C, D
            content=opt["text"],
            scoring_logic=opt["traits"]   # store the trait contributions directly
        )
        db.add(new_opt)

db.commit()
print("Leadership test seeded successfully with 20 questions!")
db.close()