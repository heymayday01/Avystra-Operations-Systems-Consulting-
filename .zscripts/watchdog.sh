#!/bin/bash
# Watchdog — keeps the Next.js dev server running permanently.
# If the server dies (OOM kill, crash, etc.), restarts it within 3 seconds.
# This is the robust fix for the environment's aggressive memory limits.
#
# The watchdog itself runs in a loop and NEVER exits. Start it with setsid
# so it's fully detached from the shell session.

cd /home/z/my-project

echo "[$(date '+%H:%M:%S')] Watchdog started — will keep Next.js alive"

while true; do
  # Check if server is responding
  if curl -s -o /dev/null --max-time 3 http://localhost:3000/ 2>/dev/null; then
    # Server is alive — sleep briefly and check again
    sleep 5
  else
    echo "[$(date '+%H:%M:%S')] Server down — starting Next.js dev server..."
    # Kill any zombie processes on port 3000
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    sleep 1

    # Start fresh
    bun run dev > dev.log 2>&1 &
    DEV_PID=$!
    echo "[$(date '+%H:%M:%S')] Started dev server (PID: $DEV_PID)"

    # Wait for it to be ready
    for i in $(seq 1 30); do
      sleep 1
      if curl -s -o /dev/null --max-time 3 http://localhost:3000/ 2>/dev/null; then
        echo "[$(date '+%H:%M:%S')] Server ready after ${i}s"
        break
      fi
    done
  fi
done
