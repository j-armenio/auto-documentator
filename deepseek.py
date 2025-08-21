import requests
import json
import sys

def call_llm(input_path):
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    url = "http://localhost:11434/api/chat"

    payload = {
        "model": "doc-coder",
        "messages": [
            {
                "role":"user",
                "content": content
            }
        ]
    }

    with requests.post(url, json=payload, stream=True) as r:
        r.raise_for_status()
        with open("output.txt", "w", encoding="utf-8") as f:
            for line in r.iter_lines():
                if line:
                    data = json.loads(line)
                    if "message" in data and "content" in data["message"]:
                        f.write(data["message"]["content"])

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 deepseek.py <caminho_arquivo>")
    else:
        call_llm(sys.argv[1])