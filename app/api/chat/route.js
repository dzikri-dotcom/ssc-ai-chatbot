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
      // Langsung return jika error sistem agar tidak masuk ke Groq
      return NextResponse.json({ reply: "Mohon maaf, sistem sedang mengalami kendala teknis." });
    }

    // KUNCI PERUBAHAN: Jika tidak ketemu di database, potong jalur di sini (Hemat Token API)
    if (contextText === "INFORMASI_TIDAK_DITEMUKAN") {
      return NextResponse.json({ 
        reply: "Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami." 
      });
    }

    // 2. PROSES KE GROQ

    const systemPrompt = `Anda adalah asisten virtual SSC Telkom University Surabaya yang profesional.
Tugas Anda adalah memberikan informasi secara LENGKAP dan TERSTRUKTUR berdasarkan DATA ACUAN yang disediakan.

DATA ACUAN:
"""
${contextText}
"""

ATURAN WAJIB (SANGAT KETAT):
1. Evaluasi dulu: Apakah DATA ACUAN membahas TOPIK SPESIFIK yang ditanyakan user? 
2. Jika user menanyakan topik spesifik (misalnya: "TAK", "KTM", dsb) dan kata/topik tersebut TIDAK ADA di DATA ACUAN, Anda WAJIB langsung menjawab persis seperti ini: "Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami."
3. JANGAN mencoba menebak, JANGAN beralasan "saya tidak paham", dan JANGAN menawarkan informasi lain meskipun ada kata kerja yang kebetulan sama (seperti "upload", "surat", atau "buat"). Langsung tolak jika topiknya berbeda.
4. Jika topiknya BENAR dan RELEVAN, berikan jawaban yang komprehensif, jangan potong langkah-langkahnya, dan gunakan format rapi (bullet points/numbering).
5. DILARANG KERAS menggunakan pengetahuan di luar DATA ACUAN.`;

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