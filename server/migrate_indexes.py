"""
Database Migration Script
Adds indexes for performance and updates relationships

Run this script once to add indexes to existing tables:
    python migrate_indexes.py

NOTE: This requires your database to be accessible.
Backup your database before running migrations!
"""
import sys
from sqlalchemy import create_engine, text, inspect

# Database URL - same as in database.py
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:21453@localhost/psych_db"

def create_index_if_not_exists(engine, index_name, table_name, columns):
    """Create an index if it doesn't already exist"""
    # Check if index exists
    inspector = inspect(engine)
    existing_indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
    
    if index_name in existing_indexes:
        print(f"  ✓ Index {index_name} already exists")
        return False
    
    # Create index
    columns_str = ', '.join(columns)
    sql = text(f"CREATE INDEX {index_name} ON {table_name} ({columns_str})")
    
    with engine.connect() as conn:
        conn.execute(sql)
        conn.commit()
    
    print(f"  ✓ Created index: {index_name} ON {table_name}({columns_str})")
    return True

def add_foreign_key_constraints(engine):
    """Add foreign key constraints with ON DELETE CASCADE"""
    constraints = [
        # Assignments
        ("assignments_user_id_fkey", "assignments", "user_id", "users", "id"),
        ("assignments_test_id_fkey", "assignments", "test_id", "tests", "id"),
        # Responses
        ("responses_user_id_fkey", "responses", "user_id", "users", "id"),
        ("responses_test_id_fkey", "responses", "test_id", "tests", "id"),
        ("responses_question_id_fkey", "responses", "question_id", "questions", "id"),
        ("responses_assignment_id_fkey", "responses", "assignment_id", "assignments", "id"),
        # Results
        ("results_user_id_fkey", "results", "user_id", "users", "id"),
        ("results_test_id_fkey", "results", "test_id", "tests", "id"),
        ("results_assignment_id_fkey", "results", "assignment_id", "assignments", "id"),
        # Exit Logs
        ("exit_logs_user_id_fkey", "exit_logs", "user_id", "users", "id"),
        ("exit_logs_assignment_id_fkey", "exit_logs", "assignment_id", "assignments", "id"),
        # Questions
        ("questions_test_id_fkey", "questions", "test_id", "tests", "id"),
        # Options
        ("options_question_id_fkey", "options", "question_id", "questions", "id"),
    ]
    
    with engine.connect() as conn:
        for constraint_name, table, column, ref_table, ref_column in constraints:
            # Check if constraint exists
            check_sql = text(f"""
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = '{constraint_name}'
            """)
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print(f"  ✓ Constraint {constraint_name} already exists")
                continue
            
            # Add foreign key with CASCADE
            alter_sql = text(f"""
                ALTER TABLE {table}
                ADD CONSTRAINT {constraint_name}
                FOREIGN KEY ({column}) REFERENCES {ref_table}({ref_column})
                ON DELETE CASCADE
            """)
            
            try:
                conn.execute(alter_sql)
                conn.commit()
                print(f"  ✓ Added FK constraint: {constraint_name}")
            except Exception as e:
                print(f"  ⚠ Warning: Could not add {constraint_name}: {e}")

def main():
    print("=" * 60)
    print("Database Migration: Adding Indexes and FK Constraints")
    print("=" * 60)
    
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("\n✓ Connected to database successfully\n")
        
        # Create indexes
        print("Creating indexes...")
        
        indexes = [
            # Users
            ("ix_users_role", "users", ["role"]),
            ("ix_users_full_name", "users", ["full_name"]),
            ("ix_users_department", "users", ["department"]),
            
            # Questions
            ("ix_questions_test_id", "questions", ["test_id"]),
            ("ix_questions_order_index", "questions", ["order_index"]),
            
            # Assignments
            ("ix_assignments_user_id", "assignments", ["user_id"]),
            ("ix_assignments_test_id", "assignments", ["test_id"]),
            ("ix_assignments_status", "assignments", ["status"]),
            ("ix_assignments_assigned_at", "assignments", ["assigned_at"]),
            ("ix_assignments_user_status", "assignments", ["user_id", "status"]),
            ("ix_assignments_test_status", "assignments", ["test_id", "status"]),
            
            # Responses
            ("ix_responses_user_id", "responses", ["user_id"]),
            ("ix_responses_test_id", "responses", ["test_id"]),
            ("ix_responses_question_id", "responses", ["question_id"]),
            ("ix_responses_assignment_id", "responses", ["assignment_id"]),
            
            # Results
            ("ix_results_user_id", "results", ["user_id"]),
            ("ix_results_test_id", "results", ["test_id"]),
            ("ix_results_assignment_id", "results", ["assignment_id"]),
            ("ix_results_score", "results", ["score"]),
            ("ix_results_completed_at", "results", ["completed_at"]),
            ("ix_results_user_completed", "results", ["user_id", "completed_at"]),
            ("ix_results_test_completed", "results", ["test_id", "completed_at"]),
            
            # Exit Logs
            ("ix_exit_logs_user_id", "exit_logs", ["user_id"]),
            ("ix_exit_logs_assignment_id", "exit_logs", ["assignment_id"]),
            ("ix_exit_logs_timestamp", "exit_logs", ["timestamp"]),
        ]
        
        created = 0
        for index_name, table_name, columns in indexes:
            if create_index_if_not_exists(engine, index_name, table_name, columns):
                created += 1
        
        print(f"\n✓ Created {created} new indexes")
        
        # Add foreign key constraints
        print("\nAdding foreign key constraints with CASCADE DELETE...")
        add_foreign_key_constraints(engine)
        
        print("\n" + "=" * 60)
        print("Migration completed successfully!")
        print("=" * 60)
        print("\nNote: SQLAlchemy ORM cascade settings are also configured.")
        print("Deletes will cascade through both ORM and database level.")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        print("\nMake sure:")
        print("  1. PostgreSQL is running")
        print("  2. Database 'psych_db' exists")
        print("  3. Credentials in this script match your setup")
        sys.exit(1)

if __name__ == "__main__":
    main()
