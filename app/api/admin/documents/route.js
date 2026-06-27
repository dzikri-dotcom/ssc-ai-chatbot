import { NextResponse } from 'next/server';
import { del, list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

function isPdfBlob(blob) {
  const pathname = String(blob.pathname || '').toLowerCase();
  const url = String(blob.url || '').toLowerCase();

  return pathname.endsWith('.pdf') || url.endsWith('.pdf');
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 KB';

  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  return `${kb.toFixed(2)} KB`;
}

function cleanFileName(pathname = '') {
  const fileName = pathname.split('/').pop() || pathname;

  if (fileName.includes('__')) {
    return fileName.split('__').slice(1).join('__');
  }

  return fileName;
}

export async function GET() {
  try {
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

    const pdfDocuments = allBlobs
      .filter(isPdfBlob)
      .map((blob) => ({
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl || blob.url,
        fileName: cleanFileName(blob.pathname),
        originalName: blob.pathname,
        size: blob.size || 0,
        sizeText: formatFileSize(blob.size || 0),
        uploadedAt: blob.uploadedAt || null
      }))
      .sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;

        return dateB - dateA;
      });

    return NextResponse.json({
      success: true,
      total: pdfDocuments.length,
      documents: pdfDocuments
    });
  } catch (error) {
    console.error('Gagal mengambil dokumen PDF:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil daftar dokumen PDF dari Vercel Blob.',
        documents: []
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const target = body?.url || body?.pathname;

    if (!target) {
      return NextResponse.json(
        {
          success: false,
          message: 'URL atau pathname dokumen tidak ditemukan.'
        },
        { status: 400 }
      );
    }

    await del(target);

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil dihapus.'
    });
  } catch (error) {
    console.error('Gagal menghapus dokumen PDF:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus dokumen PDF.'
      },
      { status: 500 }
    );
  }
}