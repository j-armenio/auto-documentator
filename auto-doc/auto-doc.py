import sys
import requests
import json
from tree_sitter_languages import get_parser

parser = get_parser("javascript")

def doc(input_path):
    

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 auto-doc.py <caminho_arquivo>")
    else:
        doc(sys.argv[1])