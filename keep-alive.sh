#!/bin/bash
while true; do
  # Try to connect to the server
  if ! curl -s -o /dev/null --connect-timeout 2 http://127.0.0.1:3000/login 2>/dev/null; then
    echo "[$(date)] Server not responding, starting..." >> /home/z/my-project/server-keepalive.log
    # Kill any existing server processes
    pkill -f "next start" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 1
    # Start the server
    cd /home/z/my-project && PORT=3000 npx next start >> /home/z/my-project/dev.log 2>&1 &
    # Wait for it to start
    for i in $(seq 1 10); do
      sleep 1
      if curl -s -o /dev/null --connect-timeout 2 http://127.0.0.1:3000/login 2>/dev/null; then
        echo "[$(date)] Server started successfully" >> /home/z/my-project/server-keepalive.log
        break
      fi
    done
  fi
  sleep 3
done
