import sqlite3
import os

DB_FILE = "inventory.db"

# Check if the database file exists
if not os.path.exists(DB_FILE):
    print(f"Database file '{DB_FILE}' not found. Nothing to do.")
else:
    try:
        # Connect to the database
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # The command to clear the broken migration record
        print("Executing command: DELETE FROM alembic_version;")
        cursor.execute("DELETE FROM alembic_version;")

        # Save (commit) the changes and close the connection
        conn.commit()
        conn.close()

        print("\nSUCCESS: The database version record has been cleared.")
        print("You can now proceed with the migration commands.")

    except sqlite3.OperationalError:
        print(f"\nNOTE: The 'alembic_version' table was not found, which is okay.")
        print("This means the database is ready for the first migration.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")