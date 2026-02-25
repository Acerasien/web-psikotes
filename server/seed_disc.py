# server/seed_disc.py
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# 1. Setup Test Container
disc_test = db.query(Test).filter(Test.code == "DISC").first()

if not disc_test:
    disc_test = Test(
        name="DISC Assessment",
        code="DISC",
        time_limit=0, # Untimed
        settings={"type": "disc"}
    )
    db.add(disc_test)
    db.commit()
    db.refresh(disc_test)
else:
    # Clear old data
    old_qs = db.query(Question).filter(Question.test_id == disc_test.id).all()
    for q in old_qs:
        db.query(Option).filter(Option.question_id == q.id).delete()
    db.query(Question).filter(Question.test_id == disc_test.id).delete()
    db.commit()

# 2. Define Indonesian Blocks (Positive/Neutral Valence)
# Format: [D, I, S, C]
blocks = [
    ["Berani mengambil risiko", "Antusias dan enerjik", "Pendengar yang sabar", "Teliti dan cermat"],
    ["Tegas dalam keputusan", "Mudah bergaul", "Setia dan mendukung", "Sistematis dalam bekerja"],
    ["Fokus pada hasil", "Optimis dan ceria", "Tenang dan sabar", "Analitis dan mendalam"],
    ["Berorientasi pada tujuan", "Pembawa suasana", "Penuh empati", "Perhatian terhadap detail"],
    ["Berani menghadapi tantangan", "Meyakinkan dalam bicara", "Penuh pengertian", "Taat pada prosedur"],
    ["Kompetitif", "Terbuka dan ekspresif", "Penyantun", "Akurat dan presisi"],
    ["Langsung ke pokok masalah", "Mudah mempengaruhi orang", "Menciptakan keharmonisan", "Mengikuti standar tinggi"],
    ["Memimpin dengan tangan besi", "Memotivasi tim", "Menghindari konflik", "Berhati-hati"],
    ["Mengambil inisiatif", "Ramah tamah", "Dapat diandalkan", "Disiplin tinggi"],
    ["Berani bersuara lantang", "Suka bersenang-senang", "Pendengar yang baik", "Logis dan faktual"],
    ["Berkeinginan kuat", "Riang gembira", "Penolong", "Perfeksionis"],
    ["Independent", "Suka bicara", "Sabar menunggu", "Kritis terhadap kualitas"],
    ["Berani memerintah", "Hangat dan bersahabat", "Mudah menyesuaikan diri", "Tepat waktu"],
    ["Tangguh", "Mudah akrab", "Lembut hati", "Konsekuen"],
    ["Pemberani", "Memukau pendengar", "Stabil secara emosi", "Konsekuen dengan aturan"],
    ["Aktif dan lincah", "Mudah memaafkan", "Rendah hati", "Teliti dengan fakta"],
    ["Mengendalikan situasi", "Mudah berteman", "Konsisten", "Memeriksa segala sesuatu"],
    ["Dominan", "Penuh semangat", "Penyabar", "Penyihir data"],
    ["Dorongan kuat", "Suka bergaul", "Suka membantu", "Fokus pada kualitas"],
    ["Berwibawa", "Menginspirasi orang lain", "Penasihat yang baik", "Perencana yang baik"],
    ["Berpikiran besar", "Ramah", "Calm", "Berhati-hati dalam bertindak"],
    ["Pengambil keputusan", "Hiburan kelompok", "Penjaga perdamaian", "Penyusun kebijakan"],
    ["Pemimpin alami", "Pembicara yang fasih", "Kerja sama tim", "Peneliti yang tekun"],
    ["Berani tampil beda", "Ceria", "Moderat", "Pemeriksa ketat"]
]

traits = ["D", "I", "S", "C"]

print("Seeding DISC Questions (Indonesian)...")

for idx, block_statements in enumerate(blocks):
    new_q = Question(
        test_id=disc_test.id,
        content=f"Pilih kata yang PALING SESUIA dan PALING TIDAK SESUAI dengan diri Anda.",
        order_index=idx + 1
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    
    labels = ["A", "B", "C", "D"]
    for i, statement in enumerate(block_statements):
        new_opt = Option(
            question_id=new_q.id,
            label=labels[i],
            content=statement,
            scoring_logic={"trait": traits[i]}
        )
        db.add(new_opt)

db.commit()
print("Successfully seeded 24 DISC blocks in Indonesian!")
db.close()