'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  LogOut,
  Loader2,
  CheckCircle,
  X,
  Info,
  Download,
  RefreshCw,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

// Daftar kategori dokumen yang bisa diupload.
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

function DocumentListAdmin() {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingPath, setDeletingPath] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);

      const response = await fetch('/api/admin/documents', {
        method: 'GET',
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil daftar dokumen.');
      }

      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gagal mengambil daftar dokumen.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const deleteDocument = async (doc) => {
    const confirmDelete = window.confirm(
      `Apakah kamu yakin ingin menghapus dokumen ini?\n\n${doc.fileName}`
    );

    if (!confirmDelete) return;

    try {
      setDeletingPath(doc.pathname);

      const response = await fetch('/api/admin/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: doc.url,
          pathname: doc.pathname
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus dokumen.');
      }

      setDocuments((prev) => prev.filter((item) => item.pathname !== doc.pathname));

      alert('Dokumen berhasil dihapus.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gagal menghapus dokumen.');
    } finally {
      setDeletingPath('');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <section className="mt-10 bg-[#151E2E]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <FileText size={16} className="text-[#CC0000]" />
            </div>
            <span className="text-sm font-bold text-slate-200">Dokumen PDF Tersimpan</span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Daftar dokumen PDF yang tersimpan di Vercel Blob. Dokumen ini dapat diunduh atau dihapus dari admin.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDocuments}
          disabled={loadingDocs}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all uppercase tracking-wider disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingDocs ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loadingDocs ? (
        <div className="bg-[#1A2333]/60 border border-slate-800 rounded-xl p-8 text-center">
          <Loader2 size={28} className="mx-auto mb-3 animate-spin text-[#CC0000]" />
          <p className="text-sm font-bold text-slate-300">Mengambil daftar dokumen...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-[#1A2333]/60 border border-dashed border-slate-700 rounded-xl p-8 text-center">
          <FileText size={34} className="mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-bold text-slate-300">Belum ada dokumen PDF tersimpan.</p>
          <p className="text-xs text-slate-500 mt-1">
            Upload dokumen terlebih dahulu agar muncul di daftar ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.pathname}
              className="bg-[#1A2333]/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-[#CC0000]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 break-words">
                      {doc.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 break-all font-medium">
                      {doc.originalName}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                        PDF
                      </span>
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                        {doc.sizeText}
                      </span>
                      {doc.uploadedAt && (
                        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                          {new Date(doc.uploadedAt).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <a
                    href={doc.downloadUrl || doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all uppercase tracking-wider"
                  >
                    <Download size={14} />
                    Download
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteDocument(doc)}
                    disabled={deletingPath === doc.pathname}
                    className="flex items-center justify-center gap-2 bg-[#CC0000]/10 border border-[#CC0000]/30 hover:bg-[#CC0000]/20 text-[#CC0000] text-xs font-bold px-4 py-3 rounded-xl transition-all uppercase tracking-wider disabled:opacity-50"
                  >
                    {deletingPath === doc.pathname ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Menghapus
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        Hapus
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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
    <div className="min-h-screen bg-[#090D14] text-slate-200 relative font-sans selection:bg-[#CC0000] selection:text-white pb-12">
      
      {/* ── ARSITEKTUR LATAR BELAKANG GEOMETRIS (DARK THEME) ── */}
      <div className="fixed inset-0 opacity-[0.15] pointer-events-none mix-blend-screen z-0">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#CC0000]/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#CC0000]/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header Premium */}
      <header className="bg-[#101726]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 h-[70px] flex items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="w-[38px] h-[38px] bg-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(204,0,0,0.15)]">
            <span className="text-[11px] font-black text-[#CC0000] tracking-widest leading-tight text-center">TEL-U</span>
          </div>
          <div>
            <p className="text-white text-sm font-black tracking-wide uppercase">SSC Document Portal</p>
            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Student Service Center</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 bg-[#CC0000]/10 border border-[#CC0000]/30 hover:bg-[#CC0000]/20 text-[#CC0000] text-xs font-bold px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
        >
          <LogOut size={14} /> Keluar
        </Link>
      </header>

      {/* Accent bar */}
      <div className="h-[2px] bg-slate-800 relative z-40">
        <div className="h-full w-[40%] bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-transparent" />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-[10px] font-bold tracking-widest uppercase text-slate-500">
          <span className="hover:text-slate-300 cursor-pointer transition-colors">Beranda</span>
          <span className="text-slate-700">/</span>
          <span className="hover:text-slate-300 cursor-pointer transition-colors">Admin</span>
          <span className="text-slate-700">/</span>
          <span className="text-[#CC0000]">Upload Dokumen</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              Upload Dokumen <span className="text-[#CC0000]">Panduan</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Ekstrak PDF menjadi basis pengetahuan terpusat chatbot SSC.
            </p>
          </div>
          <span className="bg-[#151E2E] text-slate-300 border border-slate-700 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg shadow-sm">
            Admin
          </span>
        </div>

        {/* Upload cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {CATEGORIES.map((cat) => {
            const state = docs[cat.id];
            return (
              <div key={cat.id} className="bg-[#151E2E]/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative group hover:border-slate-700 transition-colors">
                
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CC0000]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="px-6 pt-6">
                  <h3 className="text-sm font-bold text-slate-100 leading-snug tracking-wide">{cat.title}</h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">{cat.desc}</p>
                </div>

                {state.uploadSuccess && (
                  <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mx-6 mt-4 animate-in fade-in zoom-in duration-300">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300 font-semibold">Dokumen berhasil diproses dan diindeks!</span>
                  </div>
                )}

                {!state.file && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); updateDoc(cat.id, { dragOver: true }); }}
                    onDragLeave={() => updateDoc(cat.id, { dragOver: false })}
                    onDrop={(e) => handleDrop(e, cat.id)}
                    onClick={() => inputRefs.current[cat.id]?.click()}
                    className={`mx-6 my-5 border-2 border-dashed rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300
                      ${state.dragOver 
                        ? 'border-[#CC0000] bg-[#CC0000]/10 shadow-[inset_0_0_20px_rgba(204,0,0,0.1)]' 
                        : 'border-slate-700 bg-[#1A2333]/50 hover:border-slate-500 hover:bg-[#1A2333]'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300
                      ${state.dragOver ? 'bg-[#CC0000]/20 text-[#CC0000]' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                      <Upload size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-300 mb-1">Klik atau seret file ke sini</p>
                    <p className="text-[10px] text-slate-500 font-medium">Ukuran maksimum 10MB</p>
                    <span className="mt-3 bg-slate-800 border border-slate-700 text-[#CC0000] text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">Format PDF</span>
                    <input
                      ref={(el) => (inputRefs.current[cat.id] = el)}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => updateDoc(cat.id, { file: e.target.files[0] })}
                    />
                  </div>
                )}

                {state.file && (
                  <div className="mx-6 my-5 flex items-center gap-4 bg-[#1A2333] border border-slate-700/80 rounded-xl p-3.5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#CC0000]" />
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#CC0000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{state.file.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{(state.file.size / 1024).toFixed(1)} KB · PDF Document</p>
                    </div>
                    <button
                      onClick={() => removeFile(cat.id)}
                      className="w-8 h-8 bg-slate-800/50 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {state.isUploading && (
                  <div className="mx-6 mb-5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      <span className="text-[#CC0000]">{state.progressLabel}</span>
                      <span>{state.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="h-full bg-gradient-to-r from-[#B30000] to-[#FF3333] rounded-full transition-all duration-300 relative" 
                        style={{ width: `${state.progress}%` }} 
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:15px_15px] animate-[shimmer_1s_linear_infinite]" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-6 pb-6 mt-auto">
                  <button
                    onClick={(e) => handleFileUpload(e, cat)}
                    disabled={state.isUploading || !state.file}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#B30000] to-[#E60000] hover:from-[#990000] hover:to-[#CC0000] disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest disabled:text-slate-500 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-red-900/20 disabled:shadow-none border border-red-500/30 disabled:border-transparent"
                  >
                    {state.isUploading
                      ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
                      : <><Upload size={14} /> Upload & Generate</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dokumen PDF dari Vercel Blob */}
        <DocumentListAdmin />

        {/* Tips */}
        <div className="bg-[#151E2E]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Info size={16} className="text-blue-400" />
            </div>
            <span className="text-sm font-bold text-slate-200">Panduan Operasional Ekstraksi</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              'Gunakan PDF dengan teks yang dapat diseleksi, bukan hasil scan gambar.',
              'Pastikan nama file tidak mengandung spasi atau karakter khusus.',
              'Dokumen akan otomatis diekstrak dan disimpan ke basis data chatbot.',
              'Verifikasi hasil proses di sandbox sebelum mempublikasikan ke mahasiswa.'
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#CC0000] font-mono text-xs mt-0.5">&gt;_</span>
                <span className="text-xs text-slate-400 font-medium leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { background-position: -15px 0; }
          100% { background-position: 15px 0; }
        }
      `}} />
    </div>
  );
}