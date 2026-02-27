# server/seed_logic.py
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# Define 25 questions with story and options (correct answer marked)
questions_data = [
    {
        "story": "Berapa besar salah satu sudut yang dibentuk oleh kedua jarum pada pukul 4?",
        "options": ["120°", "130°", "140°", "150°"],
        "correct_index": 0
    },
    {
        "story": "Sebuah truk mengangkut gula seberat 2,3 ton, dan masih mampu mengangkut 9 kuintal gula lagi, berapakah maksimal kekuatan daya angkut truk?",
        "options": ["3,3 ton", "2,7 ton", "3,8 ton", "3,2 ton"],
        "correct_index": 3
    },
    {
        "story": "Sebuah bangunan mempunyai atap berbentuk limas segiempat. Berapa banyak sudut yang dimiliki atap bangunan tersebut?",
        "options": ["5", "4", "6", "7"],
        "correct_index": 0
    },
    {
        "story": "Ibu Rini membeli lemari seharga Rp.600.000 sudah termasuk potongan harga sebesar 20%, berapakah harga sebenarnya lemari tersebut?",
        "options": ["Rp.850.000", "Rp.750.000", "Rp.880.000", "Rp.640.000"],
        "correct_index": 1
    },
    {
        "story": "Sebidang sawah dengan panjang 60 m dan lebar 40 m, di bagian depan sawah akan dibangun pagar selebar 6 meter, berapakah luas sawah tersebut sekarang?",
        "options": ["3180 m²", "2160 m²", "2190 m²", "3215 m²"],
        "correct_index": 1
    },
    {
        "story": "Keluarga Imran berlibur ke kota Solo yang berjarak 350 km dengan menggunakan mobil, di tengah perjalanan beristirahat selama 2 jam, jika total waktu yang ditempuh adalah 5 jam, maka kecepatan rata-rata sepanjang perjalanan adalah :",
        "options": ["70 km/jam", "80 km/jam", "90 km/jam", "100 km/jam"],
        "correct_index": 0
    },
    {
        "story": "Seorang pedagang beras menjual beras kepada pengecer seberat 2 kwintal seharga Rp.650.000, memperoleh laba 30% dari harga beli dari petani, berapakah harga beli beras yang dibayarkan oleh pedagang beras kepada petani?",
        "options": ["Rp.750.000", "Rp.500.000", "Rp.680.000", "Rp.580.000"],
        "correct_index": 1
    },
    {
        "story": "Jumlah siswa satu kelas adalah 60 orang terdiri atas 35 wanita dan 25 pria, Jika ternyata yang hadir hanya 40% siswa wanita dan 60% siswa laki-laki, maka berapa persen yang hadir?",
        "options": ["48%", "29%", "30%", "28%"],
        "correct_index": 0
    },
    {
        "story": "Enam orang pekerja mampu membuat sumur dalam waktu 18 hari, jika pemilik sumur menginginkan penggalian sumur selesai dalam waktu 9 hari, maka berapa jumlah pekerja yang diperlukan?",
        "options": ["17", "12", "18", "16"],
        "correct_index": 1
    },
    {
        "story": "Jumlah penduduk suatu desa setiap 5 tahun bertambah 2 kali lipat, jika pada tahun 2020 penduduk desa berjumlah 64.000.000 berapakah jumlah penduduk desa pada tahun 2000?",
        "options": ["7 juta", "9 juta", "8 juta", "4 juta"],
        "correct_index": 3
    },
    {
        "story": "Budi, Anto dan Rudi mendirikan perusahaan dengan total modal sebesar 200 juta, Jika perbandingan jumlah modal yang mereka tanamkan adalah 1:3:6, maka besar selisih modal antara Rudi dan Anto adalah berapa?",
        "options": ["Rp.60.000.000", "Rp.50.000.000", "Rp.80.000.000", "Rp.60.000.000"],
        "correct_index": 0
    },
    {
        "story": "Antoni mengikuti ujian bahasa sebanyak 3 kali. pada tes pertama dan kedua ia mampu meraih nilai 40 point dari nilai kemungkinan terbesar 90 point, sementara pada tes terakhir dia hanya mampu meraih nilai sebanyak 70 point dari nilai kemungkinan terbesar 140 point, maka berapa persen rata-rata nilai yang dia dapatkan dalam 3 test tersebut?",
        "options": ["47.25%", "52.25%", "45.26%", "46.26%"],
        "correct_index": 3
    },
    {
        "story": "Jika sebuah mesin cetak mampu mencetak brosur sebanyak 8400 lembar per 2 jam, maka berapa banyak brosur yang dapat dicetak oleh mesin cetak dalam waktu 30 detik?",
        "options": ["37", "42", "35", "40"],
        "correct_index": 2
    },
    {
        "story": "Tentukan nilai rata-rata (mean) dari deret bilangan 1,3,5,7,9,11,13 dan 15?",
        "options": ["17", "12", "7", "8"],
        "correct_index": 3
    },
    {
        "story": "Dalam satu kelas berjumlah 40 orang, siswa yang suka bulutangkis 28 orang, yang suka tenis 29 orang, dan yang suka kedua-duanya 17 orang, maka jumlah siswa yang tidak suka kedua-duanya adalah?",
        "options": ["0", "1", "2", "3"],
        "correct_index": 0
    },
    {
        "story": "Jumlah siswa yang lulus pada tahun 2007 adalah 320 siswa dari total siswa sebanyak 450 siswa, sedangkan jumlah siswa yang lulus pada tahun 2008 adalah 240 siswa, maka berapa persen penurunan jumlah siswa yang lulus?",
        "options": ["25%", "55%", "42%", "46%"],
        "correct_index": 0
    },
    {
        "story": "Seorang penjahit mampu menjahit 2 potong baju dalam waktu 8 jam, berapa banyak baju yang dapat ia jahit dalam waktu 8 hari jika dalam setiap harinya ia beristirahat 8 jam?",
        "options": ["47", "44", "57", "48"],
        "correct_index": 3
    },
    {
        "story": "Sebuah karung gandum mempunyai bruto (berat kotor) 160 kg, berapakah netto (berat-bersih) jika tara 6%?",
        "options": ["148 kg", "126 kg", "150.4 kg", "147.2 kg"],
        "correct_index": 2
    },
    {
        "story": "Sebuah mobil bergerak dengan kecepatan rata-rata 80 km/jam, setelah 7 jam, maka jarak yang ditempuh mobil itu adalah?",
        "options": ["560 km", "570 km", "580 km", "590 km"],
        "correct_index": 0
    },
    {
        "story": "Dengan kecepatan rata-rata 45 km/jam sebuah helikopter terbang dari bandara menuju hutan yang berjarak 90 km, apabila helikopter itu terbang mulai pukul 06.00, pukul berapakah helikopter itu sampai di hutan?",
        "options": ["09.00", "10.00", "08.00", "07.45"],
        "correct_index": 2
    },
    {
        "story": "Dalam satu kelas berjumlah 56 orang, siswa yang suka membaca puisi 44 orang, yang suka menulis 28 orang, dan tidak ada siswa yang tidak suka keduanya, maka jumlah siswa yang suka kedua-duanya adalah?",
        "options": ["17", "12", "7", "16"],
        "correct_index": 3
    },
    {
        "story": "Berapakah jumlah tegel keramik yang dibutuhkan untuk melapisi lantai dengan luas 320 m² Jika panjang tegel keramik 0,8 m dan lebarnya 0,5 m?",
        "options": ["817", "720", "826", "800"],
        "correct_index": 3
    },
    {
        "story": "Dengan memakai mobil pribadi diperlukan waktu 2 jam untuk sampai di kota solo dengan kecepatan rata-rata 120 km/jam, berapakah waktu yang diperlukan jika kecepatan mobil bertambah menjadi 160 km/jam?",
        "options": ["90 menit", "68 menit", "75 menit", "110 menit"],
        "correct_index": 0
    },
    {
        "story": "Pemerintah desa mempunyai cadangan beras di lumbung padi sebanyak 6 ton untuk 1500 kk setiap kk mendapat jatah 4 kg, berapa jumlah beras yang harus disediakan jika jumlah keluarga /kk bertambah 200 kk?",
        "options": ["9,0 ton", "6,8 ton", "7,5 ton", "7,1 ton"],
        "correct_index": 1
    },
    {
        "story": "Harga sebuah kain sutra untuk setiap 4 meter adalah Rp.36.000, berapakah harga kain sutra dengan panjang 18 meter?",
        "options": ["Rp.165.000", "Rp.162.000", "Rp.175.000", "Rp.163.000"],
        "correct_index": 1
    }
]

# 1. Find or create the test container
logic_test = db.query(Test).filter(Test.code == "LOGIC").first()

if not logic_test:
    logic_test = Test(
        name="Logic & Arithmetic Test",
        code="LOGIC",
        time_limit=600,  # 10 minutes (changed from 1800)
        settings={"type": "logic", "randomize_options": True}
    )
    db.add(logic_test)
    db.commit()
    db.refresh(logic_test)
    print("Created Logic & Arithmetic Test container with 10-minute timer.")
else:
    # Update timer to 10 minutes
    logic_test.time_limit = 600
    # Clear old data
    old_qs = db.query(Question).filter(Question.test_id == logic_test.id).all()
    for q in old_qs:
        db.query(Option).filter(Option.question_id == q.id).delete()
    db.query(Question).filter(Question.test_id == logic_test.id).delete()
    db.commit()
    print("Cleared old Logic test data and updated timer to 10 minutes.")

# 2. Insert questions and options (shuffle options)
print("Seeding 25 Logic & Arithmetic questions...")
for idx, q_data in enumerate(questions_data, start=1):
    # Create question
    q = Question(
        test_id=logic_test.id,
        content=q_data["story"],
        order_index=idx
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Prepare options with correct flag
    options = q_data["options"]
    correct_index = q_data["correct_index"]
    # Create list of (text, is_correct)
    opt_list = [(opt, i == correct_index) for i, opt in enumerate(options)]
    # Shuffle options
    random.shuffle(opt_list)
    # Insert options with labels A, B, C, D
    for j, (text, is_correct) in enumerate(opt_list):
        opt = Option(
            question_id=q.id,
            label=chr(65 + j),  # A, B, C, D
            content=text,
            scoring_logic={"correct": is_correct}
        )
        db.add(opt)

db.commit()
print("Logic & Arithmetic test seeded successfully with 10-minute timer!")
db.close()