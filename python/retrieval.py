import os
import json
import math
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

EMBEDDING_MODEL = "models/gemini-embedding-001"


def cosine_similarity(vec_a, vec_b):
    """Tính độ giống nhau giữa 2 vector."""
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    return dot_product / (norm_a * norm_b)


def load_embeddings(filepath="embeddings.json"):
    """Đọc lại toàn bộ chunk + vector đã lưu."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def embed_query(question):
    """Embed câu hỏi của user (dùng task_type khác với lúc lưu tài liệu)."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=question,
        task_type="retrieval_query",
        output_dimensionality=768
    )
    return result["embedding"]


def search(question, embeddings_data, top_k=3):
    """Tìm top_k chunk liên quan nhất tới câu hỏi."""
    query_vector = embed_query(question)

    scored_chunks = []
    for chunk in embeddings_data:
        score = cosine_similarity(query_vector, chunk["embedding"])
        scored_chunks.append({
            "text": chunk["text"],
            "source": chunk["source"],
            "score": score
        })

    # Sắp xếp giảm dần theo điểm số, lấy top_k
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]


if __name__ == "__main__":
    data = load_embeddings()

    test_question = "Lương casual tính thế nào?"
    results = search(test_question, data)

    print(f"Câu hỏi: {test_question}\n")
    for i, r in enumerate(results):
        print(
            f"--- Kết quả {i+1} (điểm: {r['score']:.3f}, nguồn: {r['source']}) ---")
        print(r["text"][:200], "...\n")
