import os
from dotenv import load_dotenv
import google.generativeai as genai

# Đọc API key từ file .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Khởi tạo model và gửi thử một câu hỏi
model = genai.GenerativeModel("gemini-2.0-flash")
response = model.generate_content("Xin chào, bạn là ai?")

print(response.text)
