#!/bin/zsh
cd "${0:A:h}"
clear
echo "Prevuci dump.hex u ovaj prozor, zatim pritisni Enter:"
read "dump_path?> "
dump_path="${dump_path#\'}"
dump_path="${dump_path%\'}"
python3 PyPS3checker/checker_py3.py "$dump_path"
echo
read "odgovor?Pritisni Enter za zatvaranje..."
