import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { list } from '@vercel/blob';

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: apiKey });

const STOPWORDS = new Set([
  'bagaimana', 'cara', 'untuk', 'dengan', 'yang', 'adalah', 'apa', 'apakah',
  'dimana', 'kemana', 'kapan', 'siapa', 'mengapa', 'kenapa',
  'dan', 'atau', 'di', 'ke', 'dari', 'pada', 'ini', 'itu', 'tersebut',
  'saya', 'anda', 'kamu', 'kita', 'kami', 'aku',
  'akan', 'dapat', 'bisa', 'boleh', 'harus', 'perlu', 'sudah', 'belum',
  'membuat', 'buat', 'tolong', 'mohon', 'jelaskan', 'tentang', 'mengenai',
  'jika', 'kalau', 'maka', 'agar', 'supaya', 'serta', 'juga', 'lalu', 'kemudian',
  'sebagai', 'oleh', 'dalam', 'tidak', 'ya', 'tanya', 'pertanyaan', 'info',
  'informasi', 'gimana', 'gmn', 'min', 'kak', 'dong', 'ya',
]);

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function scoreChunk(chunkTextLower, keywords, fullQueryLower) {
  let score = 0;
  for (const kw of keywords) {
    if (chunkTextLower.includes(kw)) score += 1;
  }
  if (fullQueryLower.length > 2 && chunkTextLower.includes(fullQueryLower)) {
    score += 5;
  }
  return score;
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const rawQuery = messages[messages.length - 1]?.content || "";
    const userQuery = rawQuery.toLowerCase().trim();

    // 1. MENGAMBIL DATA DARI CLOUD (VERCEL BLOB)
    let contextText = "INFORMASI_TIDAK_DITEMUKAN";
    try {
      const { blobs } = await list({ prefix: 'knowledge.json' });
      if (blobs.length > 0) {
        // Fetch langsung ke URL Blob tanpa menggunakan fs
        const response = await fetch(blobs[0].url);
        const data = await response.json();
        const documents = data.documents || [];
        const keywords = extractKeywords(userQuery);

        const scored = [];
        documents.forEach((doc) => {
          doc.chunks.forEach((chunk) => {
            const chunkTextLower = chunk.text.toLowerCase();
            const score = scoreChunk(chunkTextLower, keywords, userQuery);
            if (score > 0) {
              scored.push({ score, source: doc.source, text: chunk.text });
            }
          });
        });

        scored.sort((a, b) => b.score - a.score);
        const foundChunks = scored
          .slice(0, 6)
          .map((c) => `[Sumber: ${c.source}]\nIsi: ${c.text}`);

        if (foundChunks.length > 0) contextText = foundChunks.join('\n\n');
      }
    } catch (err) {
      console.error("Gagal ambil data dari Blob:", err);
      contextText = "Mohon maaf, sistem sedang mengalami kendala teknis.";
    }

    // 2. PROSES KE GROQ
   const systemPrompt = `Anda adalah asisten virtual SSC Telkom University Surabaya yang profesional, ramah, dan sangat membantu.
Tugas Anda adalah memberikan informasi secara LENGKAP, DETAIL, dan MUDAH DIPAHAMI berdasarkan DATA ACUAN yang disediakan.

DATA ACUAN:
"""
${contextText}
"""

ATURAN WAJIB:
1. Berikan jawaban yang komprehensif. Jelaskan setiap detail atau langkah-langkah yang ada di DATA ACUAN secara utuh.
2. Gunakan format yang rapi (seperti bullet points, numbering, atau paragraf terstruktur) agar mudah dibaca oleh mahasiswa.
3. Jawablah HANYA menggunakan informasi dari DATA ACUAN di atas. JANGAN merangkum terlalu singkat jika data acuan berisi informasi yang panjang.
4. JANGAN gunakan pengetahuan di luar DATA ACUAN (jangan berhalusinasi atau mengarang informasi).
5. Jika DATA ACUAN berisi "INFORMASI_TIDAK_DITEMUKAN" atau konteks tidak relevan dengan pertanyaan, jawab dengan sopan: "Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami."`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-6)],
      temperature: 0.1,
      max_tokens: 1024,
    });

    return NextResponse.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ reply: "Terjadi kesalahan internal." }, { status: 500 });
  }
}