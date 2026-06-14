import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import path from 'path';
import { promises as fs } from 'fs';

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: apiKey });

// Kata-kata umum yang diabaikan saat mencari kecocokan, supaya pertanyaan
// natural seperti "bagaimana cara membuat surat dispensasi" tetap bisa
// menemukan chunk yang berisi "Surat Dispensasi adalah surat resmi...".
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

// Pecah teks jadi kata-kata yang bermakna (≥3 huruf, bukan stopword).
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

// Beri skor pada sebuah chunk berdasarkan jumlah kata kunci yang muncul,
// dengan bonus jika seluruh frasa pertanyaan juga muncul persis (substring).
function scoreChunk(chunkTextLower, keywords, fullQueryLower) {
  let score = 0;
  for (const kw of keywords) {
    if (chunkTextLower.includes(kw)) score += 1;
  }
  if (fullQueryLower.length > 2 && chunkTextLower.includes(fullQueryLower)) {
    score += 5; // bonus untuk exact phrase match
  }
  return score;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;
    const rawQuery = messages[messages.length - 1]?.content || "";
    const userQuery = rawQuery.toLowerCase().trim();

    const filePath = path.resolve(process.cwd(), 'data', 'knowledge.json');
    let contextText = "";

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      const documents = data.documents || [];
      const keywords = extractKeywords(userQuery);

      // 1. Hitung skor relevansi setiap chunk berdasarkan kata kunci
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

      // 2. Urutkan dari skor tertinggi, ambil maksimal 3 chunk terbaik
      scored.sort((a, b) => b.score - a.score);
      const foundChunks = scored
        .slice(0, 3)
        .map((c) => `[Sumber: ${c.source}]\nIsi: ${c.text}`);

      contextText = foundChunks.length > 0
        ? foundChunks.join('\n\n')
        : "INFORMASI_TIDAK_DITEMUKAN";
    } catch (err) {
      console.error("Error parsing JSON:", err);
      contextText = "Gagal memuat database.";
    }

    // --- SYSTEM PROMPT ---
    const systemPrompt = `Anda adalah asisten virtual SSC Telkom University Surabaya.
Tugas Anda HANYA memberikan informasi berdasarkan DATA ACUAN yang disediakan.

DATA ACUAN:
"""
${contextText}
"""

ATURAN WAJIB:
1. Jawablah HANYA menggunakan informasi dari DATA ACUAN di atas.
2. JANGAN gunakan pengetahuan di luar DATA ACUAN.
3. Jika DATA ACUAN berisi "INFORMASI_TIDAK_DITEMUKAN" atau informasi yang ditanyakan tidak ada di dalam DATA ACUAN, Anda WAJIB menjawab dengan sopan: "Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami."
4. Dilarang memberikan jawaban dari pengetahuan pribadi Anda.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-6)
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    return NextResponse.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ reply: "Terjadi kesalahan internal." }, { status: 500 });
  }
}