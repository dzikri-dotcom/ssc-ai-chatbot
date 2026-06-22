import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { list } from '@vercel/blob';

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });

const STOPWORDS = new Set([
  'bagaimana', 'cara', 'untuk', 'dengan', 'yang', 'adalah', 'apa', 'apakah',
  'dimana', 'kemana', 'kapan', 'siapa', 'mengapa', 'kenapa',
  'dan', 'atau', 'di', 'ke', 'dari', 'pada', 'ini', 'itu', 'tersebut',
  'saya', 'anda', 'kamu', 'kita', 'kami', 'aku',
  'akan', 'dapat', 'bisa', 'boleh', 'harus', 'perlu', 'sudah', 'belum',
  'membuat', 'buat', 'tolong', 'mohon', 'jelaskan', 'tentang', 'mengenai',
  'jika', 'kalau', 'maka', 'agar', 'supaya', 'serta', 'juga', 'lalu', 'kemudian',
  'sebagai', 'oleh', 'dalam', 'tidak', 'ya', 'tanya', 'pertanyaan', 'info',
  'informasi', 'gimana', 'gmn', 'min', 'kak', 'dong'
]);

function normalizeText(text = '') {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(text = '') {
  return normalizeText(text)
    .split(' ')
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

function scoreChunk(chunkText = '', query = '') {
  const normalizedChunk = normalizeText(chunkText);
  const normalizedQuery = normalizeText(query);
  const keywords = extractKeywords(query);

  let score = 0;

  // Cocok keyword satu per satu
  for (const keyword of keywords) {
    if (normalizedChunk.includes(keyword)) {
      score += 2;
    }
  }

  // Cocok frasa penuh
  if (normalizedQuery.length > 5 && normalizedChunk.includes(normalizedQuery)) {
    score += 10;
  }

  // Bonus kalau beberapa keyword muncul dalam chunk yang sama
  const matchedKeywords = keywords.filter((keyword) =>
    normalizedChunk.includes(keyword)
  );

  if (matchedKeywords.length >= 2) {
    score += matchedKeywords.length * 2;
  }

  // Penalti kalau terlalu sedikit kata yang cocok
  const matchRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;

  return {
    score,
    matchRatio,
    matchedKeywords
  };
}

async function getKnowledgeContext(userQuery) {
  const { blobs } = await list({ prefix: 'knowledge.json' });

  if (!blobs || blobs.length === 0) {
    return {
      found: false,
      contextText: '',
      reason: 'knowledge.json tidak ditemukan di Vercel Blob.'
    };
  }

  const response = await fetch(blobs[0].url, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return {
      found: false,
      contextText: '',
      reason: 'Gagal mengambil knowledge.json.'
    };
  }

  const data = await response.json();
  const documents = data.documents || [];

  const scoredChunks = [];

  for (const doc of documents) {
    const chunks = doc.chunks || [];

    for (const chunk of chunks) {
      const chunkText = chunk.text || '';
      const result = scoreChunk(chunkText, userQuery);

      if (result.score > 0) {
        scoredChunks.push({
          score: result.score,
          matchRatio: result.matchRatio,
          matchedKeywords: result.matchedKeywords,
          source: doc.source || 'Tidak diketahui',
          text: chunkText
        });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);

  // Ambang batas agar tidak asal ambil chunk yang cuma cocok 1 kata umum
  const relevantChunks = scoredChunks.filter((chunk) => {
    return chunk.score >= 4 || chunk.matchRatio >= 0.4;
  });

  if (relevantChunks.length === 0) {
    return {
      found: false,
      contextText: '',
      reason: 'Tidak ada chunk yang relevan.'
    };
  }

  const contextText = relevantChunks
    .slice(0, 8)
    .map((chunk, index) => {
      return `[Data ${index + 1}]
Sumber: ${chunk.source}
Kata cocok: ${chunk.matchedKeywords.join(', ')}
Isi:
${chunk.text}`;
    })
    .join('\n\n---\n\n');

  return {
    found: true,
    contextText,
    reason: 'Data relevan ditemukan.'
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    const rawQuery = messages[messages.length - 1]?.content || '';
    const userQuery = rawQuery.trim();

    if (!userQuery) {
      return NextResponse.json({
        reply: 'Silakan tuliskan pertanyaan terlebih dahulu.'
      });
    }

    const knowledge = await getKnowledgeContext(userQuery);

    if (!knowledge.found) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.'
      });
    }

    const systemPrompt = `
Anda adalah SSC Virtual Assistant Telkom University Surabaya.

Tugas utama:
Menjawab pertanyaan user berdasarkan DATA ACUAN yang diberikan.

DATA ACUAN:
"""
${knowledge.contextText}
"""

ATURAN JAWABAN:
1. Jawab hanya berdasarkan DATA ACUAN.
2. Jika DATA ACUAN memang membahas topik pertanyaan user, berikan jawaban yang jelas, lengkap, dan terstruktur.
3. Jika user bertanya dengan bahasa santai, typo, atau tidak lengkap, tetap pahami maksudnya selama masih berhubungan dengan DATA ACUAN.
4. Jangan menolak hanya karena kata-kata user tidak sama persis dengan DATA ACUAN.
5. Jika DATA ACUAN tidak cukup untuk menjawab detail tertentu, katakan bagian yang tidak tersedia.
6. Jangan mengarang informasi di luar DATA ACUAN.
7. Jangan menyebut "berdasarkan data acuan" secara berlebihan.
8. Gunakan bahasa Indonesia yang rapi dan mudah dipahami.
9. Jika berisi prosedur, gunakan langkah bernomor.
10. Jika ada link dalam DATA ACUAN, tampilkan link tersebut apa adanya.
`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 0,
      max_tokens: 1600
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content || 'Mohon maaf, jawaban tidak dapat dibuat.'
    });

  } catch (error) {
    console.error('Chat Error:', error);

    return NextResponse.json(
      {
        reply: 'Terjadi kesalahan internal pada sistem.'
      },
      { status: 500 }
    );
  }
}