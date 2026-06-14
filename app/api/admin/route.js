import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Menentukan jalur ke file database lokal (knowledge.json)
const filePath = path.join(process.cwd(), 'data/knowledge.json');

// 1. GET: Mengambil semua data dari knowledge.json untuk ditampilkan di Dashboard Admin
export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membaca basis pengetahuan akademik.' }, { status: 500 });
  }
}

// 2. POST: Menerima data baru/perubahan dari UI Admin dan menyimpannya ke file JSON
export async function POST(req) {
  try {
    const updatedData = await req.json();
    
    // Menuliskan kembali seluruh perubahan ke berkas data/knowledge.json
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Basis pengetahuan SSC berhasil diperbarui!' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan perubahan data ke berkas lokal.' }, { status: 500 });
  }
}