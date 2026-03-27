# server/seed_disc.py
import random
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
        time_limit=600,          # 10 minutes
        settings={"type": "disc"}
    )
    db.add(disc_test)
    db.commit()
    db.refresh(disc_test)
else:
    # Clear old data and update timer
    disc_test.time_limit = 600
    old_qs = db.query(Question).filter(Question.test_id == disc_test.id).all()
    for q in old_qs:
        db.query(Option).filter(Option.question_id == q.id).delete()
    db.query(Question).filter(Question.test_id == disc_test.id).delete()
    db.commit()

# 2. Define DISC Blocks with Trait Balance Validation
# Each block: [D statement, I statement, S statement, C statement]
# Position in array = trait index, NOT display position (will be randomized)
blocks = [
    ["Saya cenderung mengambil keputusan dengan cepat", "Saya mudah bergaul dan menyapa orang baru", "Saya sabar dalam mendengarkan keluhan orang lain", "Saya suka memeriksa detail pekerjaan dengan teliti"],
    ["Saya tegas dalam mempertahankan pendapat", "Saya mampu menghidupkan suasana dalam pertemuan", "Saya setia dan dapat diandalkan oleh rekan kerja", "Saya mengikuti prosedur yang telah ditetapkan"],
    ["Saya fokus pada pencapaian target", "Saya optimis menghadapi tantangan baru", "Saya tenang meskipun dalam tekanan", "Saya menganalisis masalah secara mendalam sebelum bertindak"],
    ["Saya berorientasi pada hasil akhir", "Saya mudah mencairkan suasana ketika tegang", "Saya peka terhadap perasaan orang lain", "Saya cermat dalam menyusun laporan"],
    ["Saya berani mengambil risiko yang diperhitungkan", "Saya pandai membujuk orang lain", "Saya penuh pengertian terhadap kesulitan rekan", "Saya konsisten mengikuti aturan yang berlaku"],
    ["Saya memiliki jiwa kompetitif yang tinggi", "Saya ekspresif dalam menyampaikan ide", "Saya penyantun dan tidak suka menyakiti hati orang", "Saya akurat dalam mengolah data"],
    ["Saya langsung mengemukakan masalah tanpa basa-basi", "Saya mampu mempengaruhi pendapat orang lain", "Saya menciptakan harmoni dalam tim", "Saya bekerja sesuai standar mutu"],
    ["Saya berani memimpin dan mengarahkan tim", "Saya mudah memotivasi orang di sekitar", "Saya menghindari konflik yang tidak perlu", "Saya berhati-hati sebelum mengambil keputusan"],
    ["Saya suka mengambil inisiatif dalam pekerjaan", "Saya ramah dan terbuka pada siapa pun", "Saya dapat diandalkan untuk menyelesaikan tugas", "Saya disiplin terhadap waktu dan jadwal"],
    ["Saya berani menyuarakan pendapat di forum", "Saya senang bercanda dan bersenang-senang", "Saya pendengar yang baik bagi teman", "Saya berpikir logis dan faktual"],
    ["Saya memiliki dorongan kuat untuk maju", "Saya ceria dan mudah tersenyum", "Saya suka menolong orang yang kesusahan", "Saya perfeksionis dalam pekerjaan"],
    ["Saya mandiri dalam menyelesaikan tugas", "Saya senang berbicara di depan umum", "Saya sabar menunggu proses berjalan", "Saya kritis terhadap kualitas hasil kerja"],
    ["Saya berani memberi perintah jika diperlukan", "Saya hangat dan bersahabat dengan kolega", "Saya mudah menyesuaikan diri dengan perubahan", "Saya selalu tepat waktu dalam mengumpulkan tugas"],
    ["Saya tangguh menghadapi tekanan", "Saya mudah akrab dengan orang baru", "Saya lembut hati dan tidak suka konflik", "Saya konsekuen dengan komitmen"],
    ["Saya pemberani dalam situasi sulit", "Saya mampu memikat perhatian audiens", "Saya stabil secara emosi dalam krisis", "Saya taat pada peraturan perusahaan"],
    ["Saya aktif bergerak dan tidak suka diam", "Saya mudah memaafkan kesalahan orang lain", "Saya rendah hati dan tidak mencari pujian", "Saya teliti memeriksa setiap detail"],
    ["Saya mampu mengendalikan situasi yang kacau", "Saya mudah berteman di mana pun", "Saya konsisten dalam bersikap", "Saya selalu memeriksa ulang pekerjaan saya"],
    ["Saya dominan dalam diskusi kelompok", "Saya penuh semangat dalam bekerja", "Saya penyabar terhadap kelambatan orang", "Saya suka mengumpulkan dan menganalisis data"],
    ["Saya memiliki dorongan kuat untuk mencapai target", "Saya suka bergaul dan bersosialisasi", "Saya suka membantu rekan yang kesulitan", "Saya fokus pada kualitas, bukan kuantitas"],
    ["Saya berwibawa sehingga orang segan", "Saya mampu menginspirasi orang lain", "Saya penasihat yang baik bagi teman", "Saya perencana yang matang sebelum bertindak"],
    ["Saya berpikiran besar dan visioner", "Saya ramah kepada semua orang", "Saya kalem dan tidak mudah terpancing emosi", "Saya berhati-hati dalam mengambil langkah"],
    ["Saya cepat mengambil keputusan", "Saya menjadi pusat perhatian dalam kelompok", "Saya penjaga perdamaian dalam tim", "Saya penyusun kebijakan yang sistematis"],
    ["Saya pemimpin alami yang disegani", "Saya pembicara yang fasih dan meyakinkan", "Saya suka bekerja sama dalam tim", "Saya peneliti yang tekun dan detail"],
    ["Saya berani tampil beda dari kebanyakan orang", "Saya ceria dan penuh energi positif", "Saya moderat dan tidak ekstrem dalam pandangan", "Saya pemeriksa ketat terhadap setiap kesalahan"]
]

traits = ["D", "I", "S", "C"]
trait_names = {"D": "Dominance", "I": "Influence", "S": "Steadiness", "C": "Conscientiousness"}

print("Seeding DISC Questions with randomized option positions...")

# Validate trait balance across all blocks
trait_counts = {"D": 0, "I": 0, "S": 0, "C": 0}
for block in blocks:
    if len(block) != 4:
        raise ValueError(f"Block has {len(block)} statements, expected 4")

# Count trait occurrences (each position = specific trait)
for trait_idx in range(4):
    trait_counts[traits[trait_idx]] = len(blocks)

print(f"Trait distribution: {trait_counts}")
print(f"Each trait appears {len(blocks)} times across all blocks (balanced ✓)")

# Set random seed for reproducibility (optional - remove for true random)
# random.seed(42)

for idx, block_statements in enumerate(blocks):
    # Create question
    new_q = Question(
        test_id=disc_test.id,
        content=f"Pilih satu pernyataan yang PALING SESUAI dan satu yang PALING TIDAK SESUAI dengan diri Anda.",
        order_index=idx + 1
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    # Create options with RANDOMIZED positions
    # Step 1: Create (trait, statement) pairs
    trait_statement_pairs = list(zip(traits, block_statements))
    
    # Step 2: Shuffle the pairs to randomize display order
    random.shuffle(trait_statement_pairs)
    
    # Step 3: Assign labels A, B, C, D to shuffled positions
    labels = ["A", "B", "C", "D"]
    for i, (trait, statement) in enumerate(trait_statement_pairs):
        new_opt = Option(
            question_id=new_q.id,
            label=labels[i],
            content=statement,
            scoring_logic={"trait": trait}  # Trait stays with original statement
        )
        db.add(new_opt)
    
    # Log first block for verification
    if idx == 0:
        print(f"\nBlock 1 example (randomized order):")
        for i, (trait, statement) in enumerate(trait_statement_pairs):
            print(f"  {labels[i]} ({trait}): {statement[:50]}...")

db.commit()

# Final validation
total_options = db.query(Option).join(Question).filter(Question.test_id == disc_test.id).count()
total_questions = db.query(Question).filter(Question.test_id == disc_test.id).count()

print(f"\n✅ Successfully seeded DISC Assessment!")
print(f"   - Total questions: {total_questions} (expected: 24)")
print(f"   - Total options: {total_options} (expected: 96)")
print(f"   - Option positions: Randomized to prevent position bias")
print(f"   - Trait balance: Each trait appears exactly {len(blocks)} times")

db.close()