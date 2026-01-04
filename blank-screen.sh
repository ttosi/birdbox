#!/bin/bash

# show logo screen
sudo fbi -T 1 -d /dev/fb0 -noverbose -a splash-screen.png

TIMEOUT=15
ELAPSED=0

while true; do
    if pgrep -x mpv >/dev/null; then
        # unblanks to play video
        sudo sh -c "echo 0 > /sys/class/graphics/fb0/blank"
        ELAPSED=0
    else
        # blanks after timeout
        if [ $ELAPSED -gt $TIMEOUT ]; then
            sudo sh -c "echo 1 > /sys/class/graphics/fb0/blank"
        else
            ELAPSED=$((ELAPSED + 1))
        fi
    fi
    sleep 1
done

# mpv --input-ipc-server=/tmp/mpvsocket "$@" &

# # wait until mpv is ready
# while [ ! -S /tmp/mpvsocket ]; do
#     sleep 0.05
# done

# # unblank right before playback
# echo 0 | sudo tee /sys/class/graphics/fb0/blank

# wait
# echo 1 | sudo tee /sys/class/graphics/fb0/blank