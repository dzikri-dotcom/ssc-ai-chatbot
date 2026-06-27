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

function normalizeFileName(text = '') {
  try {
    return decodeURIComponent(String(text));
  } catch {
    return String(text);
  }
}

function cleanFileName(fileName = '') {
  return String(fileName)
    .replace(/^.*[\\/]/, '')
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

function isDocumentRequest(query = '') {
  const normalizedQuery = normalizeText(query);

  const documentKeywords = [
    'dokumen',
    'file',
    'pdf',
    'panduan',
    'download',
    'unduh',
    'diunduh',
    'di download',
    'link',
    'berkas'
  ];

  return documentKeywords.some((keyword) => {
    return normalizedQuery.includes(normalizeText(keyword));
  });
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

async function listAllBlobs() {
  const allBlobs = [];
  let cursor = undefined;

  do {
    const result = await list({
      cursor,
      limit: 1000
    });

    if (Array.isArray(result.blobs)) {
      allBlobs.push(...result.blobs);
    }

    cursor = result.cursor;
  } while (cursor);

  return allBlobs;
}

function findBlobUrlBySource(blobs = [], source = '') {
  if (!source) return '';

  const cleanSource = cleanFileName(source);
  const normalizedSource = normalizeText(cleanSource);

  const matchedBlob = blobs.find((blob) => {
    const pathname = normalizeFileName(blob.pathname || '');
    const url = normalizeFileName(blob.url || '');
    const blobName = cleanFileName(pathname || url);

    const normalizedPathname = normalizeText(pathname);
    const normalizedUrl = normalizeText(url);
    const normalizedBlobName = normalizeText(blobName);

    return (
      normalizedBlobName === normalizedSource ||
      normalizedBlobName.includes(normalizedSource) ||
      normalizedSource.includes(normalizedBlobName) ||
      normalizedPathname.includes(normalizedSource) ||
      normalizedUrl.includes(normalizedSource)
    );
  });

  return matchedBlob?.url || '';
}

function makeDownloadName(source = '') {
  const cleanName = cleanFileName(source);

  const parts = cleanName.split('__');

  if (parts.length > 1) {
    return parts.slice(1).join('__');
  }

  return cleanName;
}

function uniqueDownloads(downloads = []) {
  const seen = new Set();

  return downloads.filter((item) => {
    if (!item?.url || !item?.name) return false;

    const key = `${item.name}-${item.url}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function getKnowledgeContext(userQuery, detectedTopic) {
  const { blobs } = await list({ prefix: 'knowledge.json' });

  if (!blobs || blobs.length === 0) {
    return {
      found: false,
      contextText: '',
      reason: 'knowledge.json tidak ditemukan di Vercel Blob.',
      downloads: []
    };
  }

  const response = await fetch(blobs[0].url, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return {
      found: false,
      contextText: '',
      reason: 'Gagal mengambil knowledge.json.',
      downloads: []
    };
  }

  const data = await response.json();
  const documents = Array.isArray(data.documents) ? data.documents : [];

  const allBlobs = await listAllBlobs();

  const scoredChunks = [];

  for (const doc of documents) {
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
        const sourceUrl = findBlobUrlBySource(allBlobs, source);

        scoredChunks.push({
          score: result.score,
          matchRatio: result.matchRatio,
          matchedKeywords: result.matchedKeywords,
          source,
          sourceUrl,
          downloadName: makeDownloadName(source),
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
      reason: 'Tidak ada chunk yang relevan.',
      downloads: []
    };
  }

  const contextText = scoredChunks
    .slice(0, 5)
    .map((chunk, index) => {
      return `[Data ${index + 1}]
Sumber: ${chunk.source}
Isi:
${chunk.text}`;
    })
    .join('\n\n---\n\n');

  const downloads = uniqueDownloads(
    scoredChunks
      .slice(0, 5)
      .map((chunk) => {
        return {
          name: chunk.downloadName || chunk.source,
          source: chunk.source,
          url: chunk.sourceUrl
        };
      })
  );

  return {
    found: true,
    contextText,
    reason: 'Data relevan ditemukan.',
    downloads
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
          reply: 'Terjadi kesalahan konfigurasi: GROQ_API_KEY belum tersedia.',
          downloads: []
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const messages = Array.isArray(body.messages) ? body.messages : [];

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message?.role === 'user');

    const rawQuery = lastUserMessage?.content || '';
    const userQuery = rawQuery.trim();

    if (!userQuery) {
      return NextResponse.json({
        reply: 'Silakan tuliskan pertanyaan terlebih dahulu.',
        downloads: []
      });
    }

    const detectedTopic = detectAllowedTopic(userQuery);
    const differentKnownTopic = detectDifferentKnownTopic(userQuery);

    if (!detectedTopic && differentKnownTopic) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.',
        downloads: []
      });
    }

    if (
      detectedTopic?.name === 'peminjaman unit puti' &&
      normalizeText(userQuery).includes('logistik')
    ) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.',
        downloads: []
      });
    }

    const knowledge = await getKnowledgeContext(userQuery, detectedTopic);

    if (!knowledge.found) {
      return NextResponse.json({
        reply: 'Mohon maaf, informasi tersebut tidak tersedia dalam panduan kami.',
        downloads: []
      });
    }

    const userWantsDocument = isDocumentRequest(userQuery);

    if (userWantsDocument) {
      if (knowledge.downloads.length > 0) {
        const documentList = knowledge.downloads
          .map((item, index) => `${index + 1}. ${item.name}`)
          .join('\n');

        return NextResponse.json({
          reply: `Dokumen panduan yang sesuai adalah:\n\n${documentList}\n\nSilakan klik tombol download dokumen di bawah ini.`,
          downloads: knowledge.downloads
        });
      }

      return NextResponse.json({
        reply: 'Dokumen panduan yang sesuai ditemukan, tetapi file PDF belum tersedia sebagai link download di Vercel Blob.',
        downloads: []
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
      reply: reply || 'Mohon maaf, jawaban tidak dapat dibuat.',
      downloads: []
    });

  } catch (error) {
    console.error('Chat Error:', error);

    return NextResponse.json(
      {
        reply: 'Terjadi kesalahan internal pada sistem.',
        downloads: []
      },
      { status: 500 }
    );
  }
}