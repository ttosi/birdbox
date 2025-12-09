#!/bin/bash
while true; do
    if pgrep -x mpv >/dev/null; then
        sudo sh -c "echo 0 > /sys/class/graphics/fb0/blank"
    else
        sudo sh -c "echo 1 > /sys/class/graphics/fb0/blank"
    fi
    sleep 1
done
