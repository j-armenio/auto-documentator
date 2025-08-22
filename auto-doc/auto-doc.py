import sys
import requests
import json
from tree_sitter import Parser
from tree_sitter_languages import get_language

# configura parser para js
LANGUAGE = get_language("javascript")
parset = Parser()
parser.set_language(LANGUAGE)

def doc(input_path):
    with open(input_path, "r", encoding="utf-8") as f:
        src = f.read()
    tree = parser.parse(src.encode("utf-8"))

    root = tree.root_node
    print("✅ parse ok:", root.type, "| range:", root.start_point, "->", root.end_point)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 auto-doc.py <caminho_arquivo>")
    else:
        doc(sys.argv[1])