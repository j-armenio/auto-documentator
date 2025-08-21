from transformers import AutoTokenizer
import sys

def count_tokens(input_path):
    tokenizer = AutoTokenizer.from_pretrained("codellama/CodeLlama-7b-hf")

    with open(input_path, "r", encoding="utf-8") as f:
        text = f.read()

    tokens = tokenizer.encode(text)
    print(f"Total de tokens: {len(tokens)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 token_count.py <caminho_arquivo>")
    else:
        count_tokens(sys.argv[1])