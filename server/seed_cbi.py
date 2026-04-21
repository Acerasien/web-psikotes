import re
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# The raw questions formatted as: Number (T/F) [Trait] Question Text
QUESTIONS_TEXT = """
1 (F) [Dependability] Saya biasanya mencoba mengembangkan rencana untuk pekerjaan saya.
2 (F) [Dependability] Saya bekerja dengan sangat teliti.
3 (T) [Aggression] Saat saya dalam suasana hati buruk, orang lain sulit memprediksi apa yang akan saya lakukan.
4 (T) [Aggression] Saya sulit mengendalikan emosi saat terjebak kemacetan.
5 (T) [Substance] Konsumsi alkohol saya pernah berdampak negatif terhadap pekerjaan saya.
6 (T) [Substance] Saya baru-baru ini menggunakan narkoba jenis stimulan.
7 (T) [Honesty] Menurut saya seseorang membalas ke perusahaan karena suatu alasan
8 (T) [Honesty] Semua orang menggunakan cuti sakit untuk hal lain.
9 (F) [Computer] Saya tidak akan menggunakan email perusahaan jika harus melanggar aturan perusahaan.
10 (T) [Computer] Saya pernah mengakses situs pornografi saat kerja.
11 (T) [Sexual] Saya pernah memeluk rekan kerja.
12 (T) [Sexual] Saya sering menceritakan lelucon kotor.
13 (F) [Dependability] Saya selalu menyelesaikan pekerjaan dengan tepat waktu.
14 (T) [Dependability] Saya sering menunda pekerjaan.
15 (F) [Dependability] Mudah bagi saya untuk menjaga fokus.
16 (F) [Dependability] Bekerja dengan benar lebih penting daripada bersenang-senang.
17 (T) [Aggression] Saya tidak menyadari kekuatan atas kemarahan saya.
18 (T) [Aggression] Membalas dendam itu wajar.
19 (F) [Substance] Seseorang yang membawa narkoba ke tempat kerja harus dipecat.
20 (T) [Substance] Saya pernah minum saat bekerja.
21 (T) [Honesty] Terkadang seseorang mengurangi harga untuk membantu teman.
22 (T) [Honesty] Seseorang akan mengambil uang kecil dari kas perusahaan.
23 (T) [Computer] Saya pernah meretas sistem perusahaan.
24 (T) [Computer] Saya membuka email orang lain tanpa izin.
25 (T) [Sexual] Lelucon kotor membantu saya dalam bekerja.
26 (T) [Sexual] Menyentuh rekan kerja lawan jenis menurut saya bukanlah masalah.
27 (F) [Aggression] Saya dapat mengendalikan emosi saya.
28 (T) [Aggression] Saya mudah tersinggung.
29 (F) [Dependability] Saya mengontrol pekerjaan saya dengan baik.
30 (T) [Dependability] Membawa atau mengambil perlengkapan kantor bukanlah masalah.
31 (T) [Aggression] Saya pernah memukul orang.
32 (T) [Aggression] Saya merasa harus menahan emosi.
33 (T) [Substance] Menurut saya Narkoba sebaiknya dilegalkan.
34 (T) [Substance] Saya menggunakan ganja.
35 (T) [Honesty] Saya pernah meminjam uang perusahaan tanpa izin.
36 (T) [Honesty] Saya pernah membagikan informasi rahasia perusahaan.
37 (T) [Computer] Saya pernah mengirim lelucon tidak pantas di grup kantor.
38 (T) [Computer] Saya pernah mengirim lelucon yang berbau rasial.
39 (T) [Sexual] Menurut saya komentar seksual itu wajar.
40 (T) [Sexual] Sosialisasi setelah kerja itu hal biasa menurut saya.
41 (T) [Substance] Saya pernah minum alkohol secara berlebihan sebelum kerja.
42 (F) [Substance] Saya menghindari zat berbahaya.
43 (T) [Sexual] Saya pernah menceritakan lelucon seksual.
44 (T) [Sexual] Saya pernah menceritakan lelucon rasial.
45 (T) [Aggression] Saya mudah marah.
46 (T) [Aggression] Saya tipe yang akan membalas dendam.
47 (T) [Substance] Saya pernah pakai narkoba saat kerja.
48 (T) [Substance] Saya pernah pakai obat ilegal.
49 (T) [Honesty] Saya tidak lapor saat melihat atau menemukan pencurian di lingkungan kerja.
50 (T) [Honesty] Saya pernah membantu orang untuk menyiasati sistem.
51 (F) [Computer] Saya tidak bermain game.
52 (T) [Computer] Saya pernah mengakses data perusahaan tanpa izin.
53 (T) [Sexual] Saya tipe yang suka menggoda rekan kerja lawan jenis.
54 (T) [Sexual] Menurut saya kasus pelecehan seksual terlalu dibesar-besarkan.
55 (T) [Honesty] Saya menggunakan fasilitas perusahaan tanpa izin.
56 (T) [Honesty] Saya pernah menyembunyikan kesalahan saya ke Perusahaan.
57 (F) [Dependability] Saya bekerja sebaik mungkin.
58 (F) [Dependability] Saya serius saat bekerja.
59 (T) [Aggression] Saya ingin memukul orang.
60 (T) [Aggression] Saya sulit mengontrol emosi.
61 (F) [Substance] Pengguna narkoba harus dihukum.
62 (F) [Substance] Pengguna narkoba tidak dapat diandalkan.
63 (T) [Honesty] Saya pernah tergoda untuk mencuri sesuatu milik Perusahaan.
64 (T) [Honesty] Saya pernah membawa alat kantor ke rumah.
65 (T) [Computer] Saya pakai komputer untuk urusan pribadi.
66 (F) [Computer] Saya tipe karyawan akan melaporkan pelanggaran.
67 (T) [Sexual] Saya pernah membuat komentar seksual.
68 (T) [Sexual] Menurut saya candaan berbau seksual adalah hal yang wajar.
69 (F) [Honesty] Saya merasa harus selalu patuhi aturan perusahaan.
70 (F) [Computer] Saya hanya akan menggunakan komputer kantor untuk bekerja.
71 (T) [Dependability] Saya sering melamun.
72 (F) [Dependability] Saya tidak suka membuat orang menunggu.
73 (T) [Aggression] Kemarahan saya menakutkan.
74 (T) [Aggression] Saya pernah marah saat berkendara di jalan.
75 (F) [Substance] Penjual narkoba harus dipenjara.
76 (T) [Substance] Menurut saya aturan narkoba terlalu ketat.
77 (T) [Honesty] Saya pernah menipu.
78 (T) [Honesty] Saya pernah berbohong.
79 (T) [Computer] Pakai komputer untuk keperluan pribadi menurut saya adalah hal yang wajar.
80 (T) [Computer] Boleh pakai komputer kantor untuk keperluan pribadi.
81 (T) [Sexual] Saya sering melakukan kontak fisik yang tidak perlu.
82 (T) [Sexual] Saya seringkali memuji rekan kerja secara berlebihan terutama lawan jenis.
83 (T) [Sexual] Saya pernah membuat orang lain tidak nyaman.
84 (F) [Sexual] Saya menjaga batas profesional dengan rekan kerja.
85 (F) [Dependability] Penting mengakui kesalahan.
86 (F) [Dependability] Saya tipe orang yang mengikuti aturan.
87 (T) [Aggression] Saya senang saat melihat orang lain terluka.
88 (T) [Aggression] Saya terkadang kaget dengan kemarahan saya.
89 (T) [Substance] Saya merasa akan bekerja lebih baik apabila saya memakai narkoba.
90 (F) [Substance] Saya tidak merasa aman jika orang lain atau rekan kerja minum alkohol di dekat saya.
91 (T) [Honesty] Saya pernah memalsukan dokumen.
92 (T) [Honesty] Menurut saya semua orang pernah mencuri sedikit uang perusahaan.
93 (T) [Aggression] Saya merasa ingin menyakiti orang lain.
94 (T) [Aggression] Saya merasa sulit menahan emosi.
95 (T) [Good Impression] Saya tidak pernah marah.
96 (T) [Good Impression] Saya selalu sempurna.
97 (T) [Good Impression] Saya tidak pernah salah.
98 (T) [Good Impression] Saya selalu patuh dengan aturan.
99 (F) [Dependability] Saya dapat diandalkan.
100 (F) [Dependability] Saya memiliki standar tinggi.
101 (T) [Aggression] Saya dikenal suka berkelahi.
102 (T) [Aggression] Saya suka melihat pertengkaran.
103 (F) [Substance] Pembawa narkoba harus dihukum.
104 (F) [Substance] Saya tidak pernah bawa narkoba.
105 (T) [Honesty] Banyak orang berpikir mencuri uang perusahaan.
106 (T) [Honesty] Orang akan menjual barang curian kantor jika ada kesempatan.
107 (F) [Computer] Saya tidak pakai perangkat kantor untuk urusan  pribadi.
108 (T) [Computer] Saya pakai internet kantor untuk hiburan.
109 (T) [Sexual] Menurut saya kasus pelecehan seksual terlalu dibesar-besarkan.
110 (T) [Sexual] Saya pernah menyentuh rekan kerja lawan jenis secara berlebihan.
111 (T) [Good Impression] Saya selalu benar.
112 (T) [Good Impression] Saya tidak pernah salah.
113 (T) [Dependability] Saya pernah mendapat sanksi dari perusahaan.
114 (F) [Dependability] Saya punya tujuan tinggi.
115 (T) [Aggression] Saya beberapa kali mengumpat di lingkungan kerja.
116 (T) [Aggression] Saya tidak bisa kontrol emosi.
117 (F) [Substance] Saya akan melaporkan pelanggaran.
118 (T) [Substance] Mengonsumsi Narkoba dalam jumlah kecil bukan masalah.
119 (T) [Honesty] Saya pernah menarik atau menggunakan uang perusahaan hingga saldonya menjadi minus.
120 (T) [Honesty] Menurut saya semua orang pernah berbohong sedikit.
121 (T) [Good Impression] Saya selalu dapat mengontrol emosi.
122 (T) [Good Impression] Saya tidak pernah membuat konflik.
123 (T) [Sexual] Saya pernah menggoda rekan kerja terkait hal yang tidak pantas.
124 (T) [Sexual] Saya pernah membuat komentar tidak nyaman ke orang lain.
125 (T) [Dependability] Terkadang saya meninggalkan pekerjaan untuk keperluan pribadi.
126 (F) [Dependability] Saya tipe orang yang bertanggung jawab.
127 (F) [Dependability] Saya peduli dengan kualitas kerja.
128 (F) [Dependability] Saya jarang terlambat.
129 (T) [Aggression] Orang menjauhi saya saat marah.
130 (T) [Aggression] Menurut saya terkadang orang lain terlalu sensitif.
131 (T) [Substance] Saya pernah memakai ganja sebelum kerja.
132 (T) [Substance] Saya bekerja saya pernah tidak dalam kondisi sadar secara penuh.
133 (T) [Honesty] Saya pernah mengambil barang milik orang lain.
134 (T) [Honesty] Saya pernah manfaatkan celah aturan perusahaan.
135 (F) [Computer] Saya patuh aturan perusahaan.
136 (T) [Computer] Saya pernah mengakses data perusahaan tanpa izin.
137 (T) [Sexual] Saya pernah menatap rekan kerja secara tidak pantas.
138 (T) [Sexual] Menurut saya menggoda rekan kerja itu hal yang wajar.
139 (T) [Good Impression] Saya selalu jadi contoh dari rekan kerja lain.
140 (T) [Good Impression] Saya tidak memiliki kelemahan.
"""

def seed_cbi_test():
    db = SessionLocal()
    try:
        # Check if CBI test already exists
        cbi_test = db.query(Test).filter(Test.code == "CBI").first()
        if cbi_test:
            logger.info("Tes CBI already exists. Cleaning up related data and re-seeding...")
            # Manually clean up related data (FK constraints)
            from models import Response, Result, Assignment, ExitLog
            db.query(Response).filter(Response.test_id == cbi_test.id).delete(synchronize_session=False)
            db.query(Result).filter(Result.test_id == cbi_test.id).delete(synchronize_session=False)
            db.query(ExitLog).filter(
                ExitLog.assignment_id.in_(
                    db.query(Assignment.id).filter(Assignment.test_id == cbi_test.id)
                )
            ).delete(synchronize_session=False)
            db.query(Assignment).filter(Assignment.test_id == cbi_test.id).delete(synchronize_session=False)
            
            # Now delete the test
            db.delete(cbi_test)
            db.commit()

        # Create the Test
        cbi_test = Test(
            name="CBI Test",
            code="CBI",
            time_limit=900,  # 15 minutes
            settings={
                "instructions": "Pada tes ini, Anda akan diberikan sejumlah pernyataan mengenai sikap dan perilaku. Tugas Anda adalah memilih salah satu jawaban:\n• Benar (B) → Jika pernyataan sesuai dengan diri Anda\n• Salah (S) → Jika pernyataan tidak sesuai dengan diri Anda\n\nWaktu pengerjaan pada tes ini 15 menit. Jawab pernyataan secara spontan."
            }
        )
        db.add(cbi_test)
        db.commit()
        db.refresh(cbi_test)

        # Parse questions
        lines = QUESTIONS_TEXT.strip().split("\n")
        pattern = re.compile(r"^(\d+)\s+\(([TF])\)\s+\[([^\]]+)\]\s+(.*)$")
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            match = pattern.match(line)
            if not match:
                logger.error(f"Failed to parse line: {line}")
                continue
                
            q_num = int(match.group(1))
            key = match.group(2)
            trait = match.group(3).strip()
            # Normalize trait names
            if trait == "Substance": trait = "Substance Abuse"
            if trait == "Sexual": trait = "Sexual Harassment"
            if trait == "Computer": trait = "Computer Abuse"
            
            text = match.group(4).strip()
            
            # Create Question
            question = Question(
                test_id=cbi_test.id,
                content=text,
                order_index=q_num,
                meta_data={"trait": trait, "key": key}
            )
            db.add(question)
            db.commit()
            db.refresh(question)
            
            # Setup Scoring Logic
            # (T) means True/Benar adds 1 point. (F) means False/Salah adds 1 point.
            if key == "T":
                benar_logic = {"score": 1, "trait": trait}
                salah_logic = {"score": 0, "trait": trait}
            else: # key == "F"
                benar_logic = {"score": 0, "trait": trait}
                salah_logic = {"score": 1, "trait": trait}
            
            # Create Options
            benar_option = Option(
                question_id=question.id,
                label="B",
                content="Benar",
                scoring_logic=benar_logic
            )
            salah_option = Option(
                question_id=question.id,
                label="S",
                content="Salah",
                scoring_logic=salah_logic
            )
            db.add_all([benar_option, salah_option])
            
        db.commit()
        logger.info(f"Successfully seeded Tes CBI with {len(lines)} questions.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding Tes CBI: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_cbi_test()
