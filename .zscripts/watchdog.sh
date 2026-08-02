#!/bin/bash
# Watchdog — keeps the Next.js production server running permanently.
# The sandbox environment kills background processes after ~30s.
# This watchdog restarts the server within 2s every time it dies.

cd /home/z/my-project

echo "[$(date '+%H:%M:%S')] Watchdog started — keeping server alive"

while true; do
  if curl -s -o /dev/null --max-time 3 http://localhost:3000/ 2>/dev/null; then
    sleep 3
  else
    echo "[$(date '+%H:%M:%S')] Server down — restarting..."
    pkill -9 -f "node.*server.js" 2>/dev/null
    pkill -9 -f "next-server" 2>/dev/null
    sleep 1
    nohup node .next/standalone/server.js > dev.log 2>&1 < /dev/null &
    for i in $(seq 1 10); do
      sleep 1
      if curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null; then
        echo "[$(date '+%H:%M:%S')] Server ready (${i}s)"
        break
      fi
    done
  fi
done
