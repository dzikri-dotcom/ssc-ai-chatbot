import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import pdfParse from 'pdf-parse';

// Menambah durasi maksimal fungsi agar tidak timeout saat memproses PDF besar
export const maxDuration = 60; 

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

    if (!file || !category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Input tidak valid.' }, { status: 400 });
    }

    // 1. Persiapan Data
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const chunks = chunkText(parsed.text.replace(/\n{3,}/g, '\n\n').trim());

    // 2. Hapus file PDF lama di Vercel Blob dengan prefix kategori yang sama
    const { blobs } = await list({ prefix: `${category}__` });
    for (const blob of blobs) {
      await del(blob.url);
    }

    // 3. Upload PDF baru ke Vercel Blob
    const safeName = `${category}__${file.name.replace(/\s+/g, '_')}`;
    await put(safeName, buffer, { access: 'public' });

    // 4. Update knowledge.json di Vercel Blob
    const jsonBlobList = await list({ prefix: 'knowledge.json' });
    let knowledge = { updatedAt: new Date().toISOString(), documents: [] };
    
    // Jika file sudah ada, ambil isinya
    if (jsonBlobList.blobs.length > 0) {
      try {
        const res = await fetch(jsonBlobList.blobs[0].url);
        if (res.ok) {
          knowledge = await res.json();
        }
      } catch (fetchErr) {
        console.error("Gagal fetch knowledge.json:", fetchErr);
      }
    }

    // Buat entry baru
    const newEntry = {
      category, 
      categoryLabel, 
      source: safeName, 
      uploadedAt: new Date().toISOString(),
      pageCount: parsed.numpages, 
      chunkCount: chunks.length,
      chunks: chunks.map((text, i) => ({ id: `${safeName}-chunk-${i}`, text })),
    };

    // Update atau tambah ke array documents
    const idx = knowledge.documents.findIndex((d) => d.category === category);
    if (idx >= 0) {
      knowledge.documents[idx] = newEntry;
    } else {
      knowledge.documents.push(newEntry);
    }
    knowledge.updatedAt = new Date().toISOString();

    // 5. Simpan kembali knowledge.json ke Vercel Blob
    await put('knowledge.json', JSON.stringify(knowledge, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false
    });

    return NextResponse.json({ success: true, file: safeName, chunks: chunks.length });

  } catch (err) {
    console.error('[Upload Fatal Error]:', err);
    return NextResponse.json({ 
      error: 'Gagal memproses file: ' + err.message 
    }, { status: 500 });
  }
}