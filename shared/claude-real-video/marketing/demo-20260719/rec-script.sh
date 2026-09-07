#!/bin/bash
cd /Users/leo/Projects/claude-real-video/marketing/demo-20260719
PS1_STR=$'\e[1;32m$\e[0m '
printf "%s\e[1;37mpip install 'claude-real-video[speakers]'\e[0m\n" "$PS1_STR"
rec-venv/bin/pip install 'claude-real-video[speakers]'
sleep 1
printf "\n%s\e[1;37mcrv nasa.mp4 -o rec-out --speakers\e[0m\n" "$PS1_STR"
rec-venv/bin/crv input/nasa.mp4 -o rec-out --speakers
EC=$?
sleep 2
exit $EC
