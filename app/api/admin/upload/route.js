import { NextResponse } from 'next/server';
import { put, list, del, head, BlobNotFoundError } from '@vercel/blob';
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

    console.log(`[upload] Menerima file "${file.name}" ukuran ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    let parsed;
    try {
      parsed = await pdfParse(buffer);
    } catch (parseErr) {
      console.error('[upload] pdf-parse error:', parseErr.message, '| ukuran buffer:', buffer.length);
      return NextResponse.json(
        { error: `PDF gagal diparse (${(buffer.length / 1024 / 1024).toFixed(2)} MB): ${parseErr.message}` },
        { status: 422 }
      );
    }

    const chunks = chunkText(parsed.text.replace(/\n{3,}/g, '\n\n').trim());

    // 2. Hapus file PDF lama di Vercel Blob dengan prefix kategori yang sama
    const { blobs } = await list({ prefix: `${category}__` });
    for (const blob of blobs) {
      await del(blob.url);
    }

    // 3. Upload PDF baru ke Vercel Blob
    // allowOverwrite: true sebagai pengaman jika del() di atas belum
    // sepenuhnya "settle" (ada delay propagasi pada Vercel Blob).
    const safeName = `${category}__${file.name.replace(/\s+/g, '_')}`;
    await put(safeName, buffer, { access: 'public', allowOverwrite: true });

    // 4. Update knowledge.json di Vercel Blob
    // Pakai head() (lookup langsung by pathname) — lebih tepat daripada
    // list({ prefix }) yang bisa salah tangkap pathname lain yang berawalan sama.
    let knowledge = { updatedAt: new Date().toISOString(), documents: [] };

    try {
      const meta = await head('knowledge.json');
      const res = await fetch(meta.url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        knowledge = {
          updatedAt: json.updatedAt || new Date().toISOString(),
          documents: Array.isArray(json.documents) ? json.documents : [],
        };
      }
    } catch (err) {
      if (!(err instanceof BlobNotFoundError)) {
        console.error('Gagal fetch knowledge.json:', err.message);
      }
      // BlobNotFoundError -> belum ada knowledge.json, pakai default di atas
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
    // allowOverwrite: true WAJIB di sini karena knowledge.json akan selalu
    // sudah ada setelah upload pertama — tanpa ini, put() akan throw error
    // "blob already exists" pada upload kedua dan seterusnya.
    await put('knowledge.json', JSON.stringify(knowledge, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ success: true, file: safeName, chunks: chunks.length });

  } catch (err) {
    console.error('[Upload Fatal Error]:', err);
    return NextResponse.json({
      error: 'Gagal memproses file: ' + err.message
    }, { status: 500 });
  }
}