import sys
import os

# Add the parent directory (backend/) to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Vercel needs a handler for WSGI/ASGI apps.
# For FastAPI, the 'app' object is sufficient.
