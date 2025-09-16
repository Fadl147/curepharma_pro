import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, text
from sqlalchemy.schema import CreateTable
from sqlalchemy.exc import ProgrammingError

# --- CONFIG ---
SQLITE_DB_PATH = r"C:\Users\Lenovo\Desktop\curepharma_pro\backend\inventory.db"
POSTGRES_URL = "postgresql://neondb_owner:npg_ReB8VaSUE6jZ@ep-odd-lab-a14g6c1p-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
# --------------

# Create engines
sqlite_engine = create_engine(f"sqlite:///{SQLITE_DB_PATH}")
postgres_engine = create_engine(POSTGRES_URL)

# Reflect SQLite schema
sqlite_metadata = MetaData()
sqlite_metadata.reflect(bind=sqlite_engine)

table_names = list(sqlite_metadata.tables.keys())
print(f"Tables to migrate: {table_names}")


def fix_sqlite_sql_for_postgres(sql: str) -> str:
    """
    Convert SQLite-specific SQL into Postgres-compatible SQL
    """
    fixed_sql = sql.replace("DATETIME", "TIMESTAMP")
    return fixed_sql


# --- STEP 1: Create schemas in Postgres ---
for table_name, table in sqlite_metadata.tables.items():
    print(f"\n🔄 Creating schema for {table_name}...")

    # Build CREATE TABLE statement
    table.metadata = MetaData()
    create_stmt = str(CreateTable(table).compile(postgres_engine))

    # Fix incompatible types
    create_stmt = fix_sqlite_sql_for_postgres(create_stmt)

    try:
        with postgres_engine.begin() as conn:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE;'))
            conn.execute(text(create_stmt))
        print(f"✅ Created schema for {table_name}")
    except ProgrammingError as e:
        print(f"⚠️ Could not create schema for {table_name}: {e}")


# --- STEP 2: Insert data ---
for table_name in table_names:
    print(f"\n📥 Migrating data for {table_name}...")

    df = pd.read_sql_table(table_name, sqlite_engine)

    if not df.empty:
        df.to_sql(table_name, postgres_engine, if_exists="append", index=False)
        print(f"✅ Migrated {len(df)} rows into {table_name}")
    else:
        print(f"⚠️ Skipped {table_name} (empty table)")


print("\n🎉 Migration complete! Schema + data are now in PostgreSQL with correct types.")
