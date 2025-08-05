import webview
import sys
import os
from app1 import app, db

if __name__ == '__main__':
    # Ensure the database tables are created in the correct location
    with app.app_context():
        db.create_all()

    # Create a window that displays our Flask application
    webview.create_window('CurePharma X', app, width=1280, height=800)
    webview.start(debug=False) # Make sure debug is False for the final version
