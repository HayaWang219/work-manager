#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
APP_DIR="/Users/hayawang/Downloads/work-manager"
PORT=3000
LOG="$APP_DIR/.server.log"

# If server already running on port 3000, just open browser
if lsof -i ":$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
    open "http://localhost:$PORT"
    exit 0
fi

# Start production server in background
cd "$APP_DIR"
nohup npm start > "$LOG" 2>&1 &

# Wait up to 15 seconds for server to be ready
for i in $(seq 1 30); do
    if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

open "http://localhost:$PORT"
