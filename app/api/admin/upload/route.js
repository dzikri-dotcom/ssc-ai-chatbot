import { NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

// Kategori dokumen yang diizinkan. Harus sinkron dengan `CATEGORIES`
// di halaman admin (id harus sama persis).
const ALLOWED_CATEGORIES = [
  'surat-aktif-mahasiswa',
  'alur-peminjaman-puti-1',
  'alur-peminjaman-puti-2',
  'surat-rekomendasi-beasiswa',
];

function chunkText(text, chunkSize = 500, overlap = 50) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize) {
      if (current.trim()) chunks.push(current.trim());
      const words = current.trim().split(' ');
      current = words.slice(-overlap).join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category');
    const categoryLabel = formData.get('categoryLabel') || category;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya file PDF.' }, { status: 400 });
    }
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Kategori dokumen tidak valid.' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) await mkdir(dataDir, { recursive: true });

    // Setiap kategori punya file PDF-nya sendiri, ditandai dengan prefix
    // `${category}__` agar tidak saling menimpa antar kategori.
    const prefix = `${category}__`;

    // STEP 1: Hapus PDF lama HANYA untuk kategori ini
    const existingFiles = await readdir(dataDir);
    for (const f of existingFiles) {
      if (f.toLowerCase().endsWith('.pdf') && f.startsWith(prefix)) {
        try {
          await unlink(path.join(dataDir, f));
          console.log(`[upload] Deleted old PDF for ${category}: ${f}`);
        } catch (e) {
          console.warn(`[upload] Gagal hapus ${f}:`, e.message);
        }
      }
    }

    // STEP 2: Simpan PDF baru dengan prefix kategori
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `${prefix}${file.name.replace(/\s+/g, '_')}`;
    await writeFile(path.join(dataDir, safeName), buffer);
    console.log(`[upload] Saved new PDF: ${safeName}`);

    // STEP 3: Parse PDF
    let parsed;
    try {
      parsed = await pdfParse(buffer);
    } catch (parseErr) {
      console.error('[upload] pdf-parse error:', parseErr.message);
      return NextResponse.json(
        { error: 'PDF gagal diparse: ' + parseErr.message },
        { status: 422 }
      );
    }

    const rawText = parsed.text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        { error: 'PDF tidak bisa dibaca. Pastikan bukan hasil scan gambar.' },
        { status: 422 }
      );
    }

    // STEP 4: Chunk teks
    const chunks = chunkText(rawText);

    // STEP 5: Update knowledge.json — hanya ganti entry milik kategori ini,
    // entry kategori lain tetap dipertahankan.
    const knowledgePath = path.join(dataDir, 'knowledge.json');

    let knowledge = { updatedAt: new Date().toISOString(), documents: [] };
    if (existsSync(knowledgePath)) {
      try {
        const existingRaw = await readFile(knowledgePath, 'utf-8');
        const existingJson = JSON.parse(existingRaw);
        if (Array.isArray(existingJson.documents)) {
          knowledge.documents = existingJson.documents;
        }
      } catch (e) {
        console.warn('[upload] Gagal membaca knowledge.json lama, membuat baru:', e.message);
      }
    }

    const newEntry = {
      category,
      categoryLabel,
      source: safeName,
      uploadedAt: new Date().toISOString(),
      pageCount: parsed.numpages,
      chunkCount: chunks.length,
      chunks: chunks.map((text, i) => ({
        id: `${safeName}-chunk-${i}`,
        text,
      })),
    };

    const idx = knowledge.documents.findIndex((d) => d.category === category);
    if (idx >= 0) {
      knowledge.documents[idx] = newEntry;
    } else {
      knowledge.documents.push(newEntry);
    }
    knowledge.updatedAt = new Date().toISOString();

    await writeFile(knowledgePath, JSON.stringify(knowledge, null, 2), 'utf-8');

    console.log(`[upload] knowledge.json updated for ${category}: ${chunks.length} chunks`);

    return NextResponse.json({
      success: true,
      category,
      file: safeName,
      pages: parsed.numpages,
      chunks: chunks.length,
    });

  } catch (err) {
    console.error('[upload] fatal error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + err.message },
      { status: 500 }
    );
  }
}