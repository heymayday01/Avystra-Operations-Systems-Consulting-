#!/bin/bash
# Watchdog — keeps the Next.js dev server running.
# If the server dies, restarts it within 2 seconds.
# This is the sandbox-friendly way to run the dev server: the environment
# kills background processes, but a foreground loop survives.

cd /home/z/my-project

while true; do
  echo "[$(date '+%H:%M:%S')] Starting Next.js dev server..."
  bun run dev > dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%H:%M:%S')] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
