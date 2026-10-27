#!/bin/bash

# Grammar101 - Development Server Startup Script
# Serve the application from the repository root.

cd "$(dirname "$0")/../.." || exit 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Grammar101 - Development Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found in the project root!"
    exit 1
fi

PORT="${PORT:-8001}"

echo "📁 Project Root: $(pwd)"
echo "🚀 Starting Grammar101 on http://localhost:$PORT"
echo "   In Codespaces, open port $PORT from the Ports panel."
echo ""
echo "📝 To stop the server, press Ctrl+C"
echo ""

if command -v http-server &> /dev/null; then
    http-server . -p "$PORT" -c-1
elif command -v python3 &> /dev/null; then
    python3 -m http.server "$PORT" --bind 0.0.0.0
elif command -v python &> /dev/null; then
    python -m http.server "$PORT" --bind 0.0.0.0
elif command -v npx &> /dev/null; then
    npx http-server . -p "$PORT" -c-1
else
    echo "❌ Error: No server found!"
    echo "   Install the project dependencies with npm install, or install Python 3."
    exit 1
fi
