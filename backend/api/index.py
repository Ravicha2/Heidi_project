from main import app

# Vercel needs a handler, but for FastAPI/WSGI/ASGI integration
# @vercel/python automatically detects the 'app' object if it's an ASGI app.
# However, sometimes an explicit handler is safer if using a specific adapter.
# But pure "from main import app" usually works with @vercel/python v2+.

# Just exposing the app object is sufficient.
