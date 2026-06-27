import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { list } from '@vercel/blob';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('GROQ_API_KEY belum tersedia di environment variable.');
}

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
  'informasi', 'gimana', 'gmn', 'min', 'kak', 'dong', 'nih', 'sih'
]);

const ALLOWED_TOPICS = [
  {
    name: 'surat keterangan aktif mahasiswa',
    aliases: [
      'surat keterangan aktif mahasiswa',
      'keterangan aktif mahasiswa',
      'surat aktif mahasiswa',
      'surat keterangan aktif',
      'skam',
      'aktif mahasiswa'
    ]
  },
  {
    name: 'surat dispensasi',
    aliases: [
      'surat dispensasi',
      'dispensasi'
    ]
  },
  {
    name: 'peminjaman unit puti',
    aliases: [
      'peminjaman unit puti',
      'peminjaman puti',
      'pinjam unit puti',
      'pinjam puti',
      'unit puti',
      'prosedur peminjaman unit puti',
      'peminjaman perangkat puti',
      'peminjaman barang puti',
      'barang unit puti',
      'barang puti'
    ]
  },
  {
    name: 'surat rekomendasi beasiswa',
    aliases: [
      'surat rekomendasi beasiswa',
      'rekomendasi beasiswa',
      'surat beasiswa',
      'rekomendasi untuk beasiswa'
    ]
  }
];

const KNOWN_DIFFERENT_TOPICS = [
  'logistik',
  'peminjaman logistik',
  'barang logistik',
  'ktm',
  'tak',
  'wifi',
  'parkir',
  'keuangan',
  'pembayaran',
  'ukt',
  'jadwal',
  'kelas',
  'nilai',
  'absensi',
  'presensi',
  'transkrip',
  'ijazah',
  'perpustakaan',
  'asrama',
  'beasiswa internal',
  'magang',
  'skripsi'
];

function normalizeText(text = '') {
  return String(text)
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

function detectAllowedTopic(query = '') {
  const normalizedQuery = normalizeText(query);

  for (const topic of ALLOWED_TOPICS) {
    for (const alias of topic.aliases) {
      const normalizedAlias = normalizeText(alias);

      if (normalizedQuery.includes(normalizedAlias)) {
        return topic;
      }
    }
  }

  return null;
}

function detectDifferentKnownTopic(query = '') {
  const normalizedQuery = normalizeText(query);

  for (const topic of KNOWN_DIFFERENT_TOPICS) {
    const normalizedTopic = normalizeText(topic);

    if (normalizedQuery.includes(normalizedTopic)) {
      return topic;
    }
  }

  return null;
}

function scoreChunk(chunkText = '', query = '') {
  const normalizedChunk = normalizeText(chunkText);
  const normalizedQuery = normalizeText(query);
  const keywords = extractKeywords(query);

  let score = 0;

  const matchedKeywords = keywords.filter((keyword) => {
    return normalizedChunk.includes(keyword);
  });

  for (const keyword of matchedKeywords) {
    score += 2;
  }

  if (normalizedQuery.length > 5 && normalizedChunk.includes(normalizedQuery)) {
    score += 10;
  }

  if (matchedKeywords.length >= 2) {
    score += matchedKeywords.length * 2;
  }

  const matchRatio = keywords.length > 0
    ? matchedKeywords.length / keywords.length
    : 0;

  return {
    score,
    matchRatio,
    matchedKeywords,
    keywordCount: keywords.length
  };
}

function isChunkRelevant(result, detectedTopic) {
  if (!result) return false;

  /*
    Sebelumnya terlalu longgar:
    detectedTopic => score >= 2

    Sekarang diperketat agar chunk dari layanan lain tidak mudah ikut masuk.
  */
  if (detectedTopic) {
    return result.score >= 6 && result.matchRatio >= 0.35;
  }

  return result.score >= 8 && result.matchRatio >= 0.5;
}

function isDocumentMatchTopic(doc, detectedTopic) {
  if (!detectedTopic) return true;

  const source = normalizeText(doc?.source || '');
  const category = normalizeText(doc?.category || '');
  const label = normalizeText(doc?.categoryLabel || '');
  const combined = `${source} ${category} ${label}`;

  if (detectedTopic.name === 'surat keterangan aktif mahasiswa') {
    return (
      combined.includes('aktif mahasiswa') ||
      combined.includes('surat aktif')
    );
  }

  if (detectedTopic.name === 'surat dispensasi') {
    return combined.includes('dispensasi');
  }

  if (detectedTopic.name === 'peminjaman unit puti') {
    return (
      combined.includes('puti') ||
      combined.includes('peminjaman barang')
    );
  }

  if (detectedTopic.name === 'surat rekomendasi beasiswa') {
    return (
      combined.includes('rekomendasi beasiswa') ||
      combined.includes('surat rekomendasi') ||
      combined.includes('beasiswa')
    );
  }

  return true;
}

async function getKnowledgeContext(userQuery, detectedTopic) {
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
  const documents = Array.isArray(data.documents) ? data.documents : [];

  const scoredChunks = [];

  for (const doc of documents) {
    /*
      Filter dokumen berdasarkan topik.
      Ini mencegah pertanyaan Surat Dispensasi mengambil data Surat Rekomendasi Beasiswa.
    */
    if (!isDocumentMatchTopic(doc, detectedTopic)) {
      continue;
    }

    const chunks = Array.isArray(doc.chunks) ? doc.chunks : [];

    for (const chunk of chunks) {
      const chunkText = chunk?.text || '';
      const source = doc?.source || 'Tidak diketahui';
      const categoryLabel = doc?.categoryLabel || '';

      const searchableText = `${source}\n${categoryLabel}\n${chunkText}`;
      const result = scoreChunk(searchableText, userQuery);

      if (isChunkRelevant(result, detectedTopic)) {
        scoredChunks.push({
          score: result.score,
          matchRatio: result.matchRatio,
          matchedKeywords: result.matchedKeywords,
          source,
          text: chunkText
        });
      }
    }
  }

  scoredChunks.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.matchRatio - a.matchRatio;
  });

  if (scoredChunks.length === 0) {
    return {
      found: false,
      contextText: '',
      reason: 'Tidak ada chunk yang relevan.'
    };
  }

  /*
    Ambil 5 chunk terbaik saja.
    Sebelumnya 8 chunk, terlalu banyak dan bisa membuat jawaban melebar.
  */
  const contextText = scoredChunks
    .slice(0, 5)
    .map((chunk, index) => {
      return `[Data ${index + 1}]
Sumber: ${chunk.source}
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

function buildSystemPrompt({ contextText, detectedTopic }) {
  return `
Anda adalah SSC Virtual Assistant Telkom University Surabaya.

Tugas Anda:
Menjawab pertanyaan user hanya berdasarkan DATA ACUAN yang diberikan.

TOPIK LAYANAN YANG TERDETEKSI:
${detectedTopic ? detectedTopic.name : 'Tidak terdeteksi secara eksplisit'}

DATA ACUAN:
"""
${contextText}
"""

ATURAN WAJIB:
1. Jawab hanya berdasarkan DATA ACUAN.
2. Jangan menggunakan pengetahuan di luar DATA ACUAN.
3. Jangan menyamakan dua layanan yang berbeda.
4. "Peminjaman logistik" tidak sama dengan "peminjaman Unit PuTI".
5. Jika user menanyakan layanan yang tidak ada di DATA ACUAN, jawab persis:
"Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami."
6. Jawab sesuai inti pertanyaan user, jangan menambahkan informasi yang tidak ditanyakan.
7. Jika pertanyaan meminta definisi, jawab definisi secara singkat dalam 1 paragraf.
8. Jika pertanyaan meminta prosedur atau langkah, gunakan langkah bernomor.
9. Jika pertanyaan meminta daftar, gunakan poin-poin singkat.
10. Jangan menyebut frasa "DATA ACUAN" atau "berdasarkan DATA ACUAN" dalam jawaban.
11. Jika ada link dalam DATA ACUAN, tampilkan link tersebut apa adanya.
12. Gunakan bahasa Indonesia yang rapi, natural, dan mudah dipahami.
`;
}

export async function POST(req) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        {
          reply: 'Terjadi kesalahan konfigurasi: GROQ_API_KEY belum tersedia.'
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    /*
      Frontend kamu mengirim format:
      {
        messages: [
          { role: 'assistant', content: '...' },
          { role: 'user', content: 'pertanyaan user' }
        ]
      }
    */
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message?.role === 'user');

    const rawQuery = lastUserMessage?.content || '';
    const userQuery = rawQuery.trim();

    if (!userQuery) {
      return NextResponse.json({
        reply: 'Silakan tuliskan pertanyaan terlebih dahulu.'
      });
    }

    const detectedTopic = detectAllowedTopic(userQuery);
    const differentKnownTopic = detectDifferentKnownTopic(userQuery);

    if (!detectedTopic && differentKnownTopic) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.'
      });
    }

    if (
      detectedTopic?.name === 'peminjaman unit puti' &&
      normalizeText(userQuery).includes('logistik')
    ) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.'
      });
    }

    const knowledge = await getKnowledgeContext(userQuery, detectedTopic);

    if (!knowledge.found) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.'
      });
    }

    const systemPrompt = buildSystemPrompt({
      contextText: knowledge.contextText,
      detectedTopic
    });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 0,
      max_tokens: 900
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      reply: reply || 'Mohon maaf, jawaban tidak dapat dibuat.'
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