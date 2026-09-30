#!/usr/bin/env bash
cd "$(dirname "$0")"
printf 'Putanja do dump.hex: '
read -r dump_path
python3 PyPS3checker/checker_py3.py "$dump_path"
