import os


def chunk_text(text, chunk_size=250, overlap=50):
    """
    Cắt văn bản thành các đoạn nhỏ theo số từ.
    chunk_size: số từ mỗi đoạn
    overlap: số từ lặp lại giữa 2 đoạn liền kề, để giữ ngữ cảnh
    """
    words = text.split()  # tách văn bản thành danh sách từng từ
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        start += chunk_size - overlap  # lùi lại 1 đoạn overlap trước khi cắt tiếp

    return chunks


def load_and_chunk_all(data_folder="data"):
    """
    Đọc tất cả file .txt trong thư mục data/, chunking từng file,
    trả về danh sách dict gồm: nội dung chunk + tên file gốc (để sau này biết nguồn)
    """
    all_chunks = []

    for filename in os.listdir(data_folder):
        if filename.endswith(".txt"):
            filepath = os.path.join(data_folder, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()

            chunks = chunk_text(text)
            for i, chunk in enumerate(chunks):
                all_chunks.append({
                    "source": filename,
                    "chunk_id": i,
                    "text": chunk
                })

    return all_chunks


if __name__ == "__main__":
    result = load_and_chunk_all()
    print(f"Tổng số chunk tạo được: {len(result)}")
    print("\n--- Chunk đầu tiên ---")
    print(result[0]["text"][:300], "...")  # in 300 ký tự đầu để xem thử
