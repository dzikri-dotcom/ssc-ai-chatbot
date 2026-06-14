'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle,
  FileText,
  Package,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  LogIn,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    title: 'Surat Aktif Mahasiswa',
    desc: 'Cara pengajuan surat keterangan aktif mahasiswa via TOSS.',
  },
  {
    icon: Package,
    title: 'Peminjaman Barang PuTI',
    desc: 'Alur & ketentuan peminjaman barang Unit PuTI.',
  },
  {
    icon: GraduationCap,
    title: 'Rekomendasi Beasiswa',
    desc: 'Langkah-langkah pengajuan surat rekomendasi beasiswa.',
  },
  {
    icon: ShieldCheck,
    title: 'Surat Dispensasi',
    desc: 'Cara pengajuan surat dispensasi.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fcfbfa] relative overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-[#CC0000]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[380px] h-[380px] bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#CC0000]/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#CC0000] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-red-500/20 overflow-hidden p-1.5">
            <Image
              src="/img/telu.png"
              alt="Telkom University Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800 leading-tight">Telkom University</p>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wide">Surabaya — Student Service Center</p>
          </div>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-[#CC0000] hover:text-[#CC0000] transition-colors shadow-sm"
        >
          <LogIn size={14} />
          Login Admin SSC
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-[#CC0000] text-[11px] font-bold px-4 py-1.5 rounded-full mb-6">
          <Sparkles size={13} />
          Didukung AI &middot; Selalu Siap 24/7
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-3xl">
          Chat <span className="text-[#CC0000]">Virtual Assistant</span> SSC
        </h1>

        <p className="mt-5 text-slate-500 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
          Tanyakan apa saja seputar layanan TOSS — mulai dari surat aktif mahasiswa,
          peminjaman barang Unit PuTI, hingga rekomendasi beasiswa. Asisten virtual SSC
          siap membantu kapan saja.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/chat"
            className="group flex items-center gap-2 bg-[#CC0000] text-white text-sm font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-red-500/25 hover:bg-[#A30000] active:scale-[0.98] transition-all"
          >
            <MessageCircle size={17} />
            Mulai Chat Sekarang
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-white text-slate-600 text-sm font-bold px-7 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
          >
            Masuk sebagai Admin
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 w-full">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">
            Yang bisa dibantu Asisten SSC
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#CC0000]/30 hover:shadow-lg hover:shadow-red-500/5 transition-all"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={18} className="text-[#CC0000]" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8">
        <p className="text-[11px] text-slate-400 font-semibold tracking-wide">
          &copy; 2026 Student Service Center — Telkom University Surabaya
        </p>
      </footer>
    </div>
  );
}