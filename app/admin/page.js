'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, LogOut, Loader2, CheckCircle, X, Info } from 'lucide-react';
import Link from 'next/link';

// Daftar kategori dokumen yang bisa diupload.
// NOTE: kategori #3 sengaja diberi judul yang sama dengan #2 sesuai permintaan,
// silakan ganti `title` di bawah jika seharusnya berbeda.
const CATEGORIES = [
  {
    id: 'surat-aktif-mahasiswa',
    title: 'Surat Keterangan Aktif Mahasiswa',
    desc: 'Panduan & format surat keterangan aktif mahasiswa',
  },
  {
    id: 'alur-peminjaman-puti-1',
    title: 'Alur dan Ketentuan Peminjaman Barang Unit PuTI',
    desc: 'Prosedur peminjaman barang Unit PuTI',
  },
  {
    id: 'alur-peminjaman-puti-2',
    title: 'Panduan Pengajuan Surat Dispensasi',
    desc: 'Panduan & format surat dispensasi',
  },
  {
    id: 'surat-rekomendasi-beasiswa',
    title: 'Surat Rekomendasi Beasiswa',
    desc: 'Panduan & format surat rekomendasi beasiswa',
  },
];

const PROGRESS_STEPS = [
  { w: 15, t: 'Mengunggah file...' },
  { w: 35, t: 'Mengekstrak teks PDF...' },
  { w: 60, t: 'Memproses konten...' },
  { w: 80, t: 'Memperbarui basis data...' },
  { w: 95, t: 'Hampir selesai...' },
  { w: 100, t: 'Selesai!' },
];

const initialDocState = () => ({
  file: null,
  isUploading: false,
  uploadSuccess: false,
  dragOver: false,
  progress: 0,
  progressLabel: '',
});

export default function AdminDashboard() {
  const [docs, setDocs] = useState(() =>
    CATEGORIES.reduce((acc, c) => {
      acc[c.id] = initialDocState();
      return acc;
    }, {})
  );

  const inputRefs = useRef({});

  const updateDoc = (id, patch) => {
    setDocs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const simulateProgress = (id) => {
    let i = 0;
    return new Promise((resolve) => {
      const iv = setInterval(() => {
        if (i >= PROGRESS_STEPS.length) {
          clearInterval(iv);
          resolve();
          return;
        }
        updateDoc(id, { progress: PROGRESS_STEPS[i].w, progressLabel: PROGRESS_STEPS[i].t });
        i++;
      }, 420);
    });
  };

  const handleFileUpload = async (e, cat) => {
    e.preventDefault();
    const state = docs[cat.id];
    if (!state.file) return;

    updateDoc(cat.id, { isUploading: true, progress: 0 });

    const formData = new FormData();
    formData.append('file', state.file);
    formData.append('category', cat.id);
    formData.append('categoryLabel', cat.title);

    try {
      const [res] = await Promise.all([
        fetch('/api/admin/upload', { method: 'POST', body: formData }),
        simulateProgress(cat.id),
      ]);

      if (res.ok) {
        updateDoc(cat.id, { uploadSuccess: true, file: null });
        if (inputRefs.current[cat.id]) inputRefs.current[cat.id].value = '';
        setTimeout(() => updateDoc(cat.id, { uploadSuccess: false }), 5000);
      } else {
        alert('Gagal memproses file.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      updateDoc(cat.id, { isUploading: false, progress: 0 });
    }
  };

  const handleDrop = (e, catId) => {
    e.preventDefault();
    updateDoc(catId, { dragOver: false });
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') updateDoc(catId, { file: dropped });
    else alert('Hanya file PDF yang diizinkan.');
  };

  const removeFile = (catId) => {
    updateDoc(catId, { file: null });
    if (inputRefs.current[catId]) inputRefs.current[catId].value = '';
  };

  return (
    <div className="min-h-screen bg-[#f5f4f2]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header className="bg-[#CC0000] px-6 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] bg-white rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#CC0000] leading-tight text-center">TEL-U</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">SSC Document Portal</p>
            <p className="text-white/60 text-[11px]">Student Service Center — Telkom University</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <LogOut size={13} /> Keluar
        </Link>
      </header>

      {/* Accent bar */}
      <div className="h-[3px] bg-[#CC0000]">
        <div className="h-full w-[40%] bg-[#FF6B35]" />
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-5 text-[11px]">
          <span className="text-gray-400">Beranda</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-400">Admin</span>
          <span className="text-gray-300">›</span>
          <span className="text-[#CC0000] font-medium">Upload Dokumen</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Upload Dokumen Panduan</h1>
            <p className="text-sm text-gray-400 mt-1">Ekstrak PDF menjadi basis pengetahuan chatbot SSC</p>
          </div>
          <span className="bg-red-50 text-[#CC0000] text-[11px] font-semibold px-3 py-1 rounded-full border border-red-200">
            Admin
          </span>
        </div>

        {/* Upload cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {CATEGORIES.map((cat) => {
            const state = docs[cat.id];
            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-5 pt-5">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{cat.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{cat.desc}</p>
                </div>

                {/* Success banner */}
                {state.uploadSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mx-5 mt-3">
                    <CheckCircle size={15} className="text-green-600 shrink-0" />
                    <span className="text-xs text-green-700 font-medium">Dokumen berhasil diproses!</span>
                  </div>
                )}

                {/* Drop zone */}
                {!state.file && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); updateDoc(cat.id, { dragOver: true }); }}
                    onDragLeave={() => updateDoc(cat.id, { dragOver: false })}
                    onDrop={(e) => handleDrop(e, cat.id)}
                    onClick={() => inputRefs.current[cat.id]?.click()}
                    className={`mx-5 my-4 border-2 border-dashed rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all
                      ${state.dragOver ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-[#CC0000] hover:bg-red-50/40'}`}
                  >
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-2.5">
                      <Upload size={18} className="text-[#CC0000]" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800">Klik atau seret file ke sini</p>
                    <p className="text-[11px] text-gray-400 mt-1">Ukuran maksimum 10MB</p>
                    <span className="mt-2.5 bg-red-50 text-[#CC0000] text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-red-200">PDF saja</span>
                    <input
                      ref={(el) => (inputRefs.current[cat.id] = el)}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => updateDoc(cat.id, { file: e.target.files[0] })}
                    />
                  </div>
                )}

                {/* File selected */}
                {state.file && (
                  <div className="mx-5 my-4 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[#CC0000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{state.file.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{(state.file.size / 1024).toFixed(1)} KB · PDF</p>
                    </div>
                    <button
                      onClick={() => removeFile(cat.id)}
                      className="w-7 h-7 bg-white border border-gray-200 rounded-md flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-[#CC0000] hover:border-red-200 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* Progress */}
                {state.isUploading && (
                  <div className="mx-5 mb-4">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                      <span>{state.progressLabel}</span>
                      <span>{state.progress}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#CC0000] rounded-full transition-all duration-400" style={{ width: `${state.progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={(e) => handleFileUpload(e, cat)}
                  disabled={state.isUploading || !state.file}
                  className="flex items-center justify-center gap-2 mx-5 mb-5 mt-auto bg-[#CC0000] text-white rounded-xl py-2.5 text-xs font-semibold disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#b00000] active:scale-[0.98] transition-all"
                >
                  {state.isUploading
                    ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
                    : <><Upload size={14} /> Upload &amp; Generate</>
                  }
                </button>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={15} className="text-[#CC0000]" />
            <span className="text-sm font-semibold text-gray-900">Panduan upload</span>
          </div>
          <ul className="space-y-2">
            {[
              'Gunakan PDF dengan teks yang dapat diseleksi, bukan hasil scan gambar',
              'Pastikan nama file tidak mengandung spasi atau karakter khusus',
              'Dokumen akan otomatis diekstrak dan disimpan ke basis data chatbot sesuai kategorinya',
              'Verifikasi hasil proses sebelum mempublikasikan ke mahasiswa',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 shrink-0" />
                <span className="text-xs text-gray-500 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

      </main>
    </div>
  );
}