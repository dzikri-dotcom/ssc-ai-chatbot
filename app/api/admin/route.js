import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

// Nama file di Vercel Blob
const BLOB_PATH = 'knowledge.json';

// 1. GET: Mengambil data dari Vercel Blob
export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (blobs.length === 0) {
      return NextResponse.json([]); // Return array kosong jika belum ada data
    }
    
    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil basis pengetahuan dari cloud.' }, { status: 500 });
  }
}

// 2. POST: Menyimpan data baru ke Vercel Blob
export async function POST(req) {
  try {
    const updatedData = await req.json();
    
    // Upload/Timpa file di Vercel Blob dengan data baru
    // Kita gunakan { access: 'public', token: ... } secara otomatis 
    // akan menggunakan BLOB_READ_WRITE_TOKEN dari environment variable
    await put(BLOB_PATH, JSON.stringify(updatedData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // Penting: agar namanya tetap knowledge.json
    });
    
    return NextResponse.json({ success: true, message: 'Basis pengetahuan SSC berhasil diperbarui di Cloud!' });
  } catch (error) {
    console.error("Blob Upload Error:", error);
    return NextResponse.json({ error: 'Gagal menyimpan data ke Vercel Blob.' }, { status: 500 });
  }
}