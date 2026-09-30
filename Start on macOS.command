#!/bin/zsh
cd "${0:A:h}"
clear
echo "PS3 Lokalni Flasher Proxy"
echo "=========================="
python3 ps3_proxy.py
echo
read "odgovor?Pritisni Enter za zatvaranje..."
