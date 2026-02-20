#!/bin/bash

# Grammar101 - Development Server Startup Script
# This script starts a proper web server from the src/ directory

cd "$(dirname "$0")" || exit 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Grammar101 - Development Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -d "src" ]; then
    echo "❌ Error: src/ directory not found!"
    echo "   Please run this script from the project root directory"
    exit 1
fi

PORT=8001

echo "📁 Project Structure:"
echo "   Root: $(pwd)"
echo "   Source: $(pwd)/src"
echo ""

# Try different server options
if command -v python3 &> /dev/null; then
    echo "🚀 Starting Python HTTP Server on http://localhost:$PORT"
    echo "   (serving from src/ directory)"
    echo ""
    echo "📝 To stop the server, press Ctrl+C"
    echo ""
    cd src && python3 -m http.server $PORT
    
elif command -v python &> /dev/null; then
    echo "🚀 Starting Python HTTP Server on http://localhost:$PORT"
    cd src && python -m http.server $PORT
    
elif command -v npx &> /dev/null; then
    echo "🚀 Starting Node HTTP Server on http://localhost:$PORT"
    cd src && npx http-server -p $PORT
    
else
    echo "❌ Error: No server found!"
    echo "   Please install one of:"
    echo "   - Python 3 (recommended): python3 -m http.server"
    echo "   - Node.js: npm install -g http-server"
    exit 1
fi
