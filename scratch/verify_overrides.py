# d:/Kerja/Web_Psikotes/web-psikotes/scratch/verify_overrides.py
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, ClassConfig, Test, Phase, Assignment
import json

db: Session = SessionLocal()

def verify():
    # Find a test user or create one
    user = db.query(User).filter(User.username == "test_participant").first()
    if not user:
        user = User(username="test_participant", role="participant", full_name="Test Participant")
        db.add(user)
        db.commit()
        db.refresh(user)

    # Assign "HO Non Staff" class (Group B)
    # Group B IQ Ph1 timer: 4 min = 240s
    cls = db.query(ClassConfig).filter(ClassConfig.name == "HO Non Staff").first()
    if not cls:
        print("HO Non Staff class not found!")
        return

    user.class_id = cls.id
    db.commit()

    # Find IQ Test
    iq_test = db.query(Test).filter(Test.code == "IQ").first()
    
    # Mock some logic from iq.get_phases
    # In a real scenario we'd call the endpoint, but here we test the logic we added
    phases = db.query(Phase).filter(Phase.test_id == iq_test.id).order_by(Phase.order_number).all()
    
    print(f"User: {user.username}, Class: {cls.name}")
    print("IQ Phase Overrides Test:")
    for p in phases:
        timer_seconds = p.timer_seconds
        class_config = user.class_config
        if class_config:
            time_overrides = class_config.config.get("time_overrides", {})
            iq_overrides = time_overrides.get("IQ", {})
            if isinstance(iq_overrides, dict) and "phases" in iq_overrides:
                phase_timers = iq_overrides["phases"]
                if len(phase_timers) >= p.order_number:
                    timer_seconds = phase_timers[p.order_number - 1]
        
        print(f"  Phase {p.order_number}: DB={p.timer_seconds}s, Effective={timer_seconds}s")
        if p.order_number == 1 and timer_seconds != 240:
            print("  FAILED: Phase 1 should be 240s for HO Non Staff")

    # Verify MEM
    print("\nMemory Test Overrides Test:")
    test_settings = {"encoding_time": 180, "recall_time": 600} # Default
    if iq_test.code == "IQ": # Just testing logic, using dummy code
        mem_code = "MEM"
        if user.class_config:
            time_overrides = user.class_config.config.get("time_overrides", {})
            mem_overrides = time_overrides.get(mem_code, {})
            if isinstance(mem_overrides, dict):
                if "encoding" in mem_overrides:
                    test_settings["encoding_time"] = mem_overrides["encoding"]
                if "recall" in mem_overrides:
                    test_settings["recall_time"] = mem_overrides["recall"]
    
    print(f"  MEM Settings: {test_settings}")
    if test_settings["encoding_time"] != 180: # HO Non Staff is still 180
        print("  Wait, HO Non Staff encoding should be 180s")
    
    # Try Site Operator (Group C) - Enc should be 300
    cls_c = db.query(ClassConfig).filter(ClassConfig.name == "Site Operator").first()
    user.class_id = cls_c.id
    db.commit()
    db.refresh(user)
    
    test_settings = {"encoding_time": 180, "recall_time": 600}
    time_overrides = user.class_config.config.get("time_overrides", {})
    mem_overrides = time_overrides.get("MEM", {})
    if isinstance(mem_overrides, dict):
        if "encoding" in mem_overrides:
            test_settings["encoding_time"] = mem_overrides["encoding"]
        if "recall" in mem_overrides:
            test_settings["recall_time"] = mem_overrides["recall"]
            
    print(f"  Site Operator MEM Settings: {test_settings}")
    if test_settings["encoding_time"] == 300:
        print("  SUCCESS: Site Operator encoding is 300s")

verify()
db.close()
