#!/bin/bash
cd /home/z/my-project

# Double-fork to daemonize
(while true; do
  node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] Server exited, restarting in 5s..." >> /home/z/my-project/dev.log
  sleep 5
done) &
echo $! > /home/z/my-project/.dev-server-pid
