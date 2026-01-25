import os
from groq import Groq

# Make sure the key exists
if not os.getenv("GROQ_API_KEY"):
    raise SystemExit("❌ GROQ_API_KEY not set. Run: export GROQ_API_KEY='your_key'")

client = Groq()  # reads GROQ_API_KEY from env

resp = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": "Say hi to Tiny Steps in 1 line"}],
)

print(resp.choices[0].message.content)

