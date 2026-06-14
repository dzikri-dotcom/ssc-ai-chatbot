import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

// 1. GET: Mengambil data dari Vercel Blob
export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'knowledge.json' });
    
    if (blobs.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching knowledge from blob:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dari cloud.' }, { status: 500 });
  }
}

// 2. POST: Menyimpan data ke Vercel Blob
export async function POST(req) {
  try {
    const updatedData = await req.json();
    
    // Menyimpan data ke Blob (menggantikan file sistem lokal)
    await put('knowledge.json', JSON.stringify(updatedData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false // Agar nama file tetap 'knowledge.json'
    });
    
    return NextResponse.json({ success: true, message: 'Basis pengetahuan SSC berhasil diperbarui!' });
  } catch (error) {
    console.error('Error saving knowledge to blob:', error);
    return NextResponse.json({ error: 'Gagal menyimpan perubahan ke cloud.' }, { status: 500 });
  }
}