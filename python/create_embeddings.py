import os
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai
from chunking import load_and_chunk_all   # tái sử dụng hàm ở Bài 2

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

EMBEDDING_MODEL = "models/gemini-embedding-001"


def get_embedding(text):
    """Gọi Gemini để lấy vector embedding cho 1 đoạn text."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        # báo cho model biết đây là văn bản để lưu trữ/tra cứu
        task_type="retrieval_document"
    )
    return result["embedding"]


def build_embeddings_database():
    chunks = load_and_chunk_all()
    print(f"Tổng số chunk cần tạo embedding: {len(chunks)}")

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = get_embedding(chunk["text"])
        print(f"Đã xử lý {i + 1}/{len(chunks)}")
        # tránh gọi API quá nhanh, dễ bị giới hạn tốc độ (rate limit)
        time.sleep(0.5)

    with open("embeddings.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print("Đã lưu embeddings.json")


if __name__ == "__main__":
    build_embeddings_database()
