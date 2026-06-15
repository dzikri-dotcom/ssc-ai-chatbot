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
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    title: 'Surat Aktif Mahasiswa',
    desc: 'Cara pengajuan surat keterangan aktif mahasiswa resmi via layanan TOSS.',
    tag: 'Populer',
  },
  {
    icon: Package,
    title: 'Peminjaman Barang PuTI',
    desc: 'Alur, ketersediaan, & ketentuan peminjaman aset barang milik Unit PuTI.',
    tag: 'Fasilitas',
  },
  {
    icon: GraduationCap,
    title: 'Rekomendasi Beasiswa',
    desc: 'Langkah taktis pengajuan dokumen surat rekomendasi beasiswa internal & eksternal.',
    tag: 'Akademik',
  },
  {
    icon: ShieldCheck,
    title: 'Surat Dispensasi',
    desc: 'Prosedur pengajuan dispensasi kegiatan resmi mahasiswa agar terdata valid.',
    tag: 'Absensi',
  },
];

const STATS = [
  { value: '24/7', label: 'Asisten Siap Siaga' },
  { value: 'Instant', label: 'Respon Kecerdasan Buatan' },
  { value: '100%', label: 'Terintegrasi ' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 relative overflow-hidden font-sans selection:bg-[#CC0000] selection:text-white">
      
      {/* Background Decorative Grid & Glow Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen z-0">
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#CC0000]/30 via-transparent to-transparent blur-3xl" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#CC0000]/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-60 w-[500px] h-[500px] bg-[#FFB800]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#CC0000]/10 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
          style={{ opacity: 0.6 }}
        />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 backdrop-blur-md bg-[#0B0F19]/70 sticky top-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-900/30 overflow-hidden p-1.5 border border-slate-700 transition-transform group-hover:scale-105">
              <Image
                src="/img/telu.png"
                alt="Telkom University Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wide uppercase leading-tight">
                Telkom <span className="text-[#CC0000]">University</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
                Surabaya &bull; Student Service Center
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-xs font-bold tracking-wider uppercase text-slate-400 hover:text-white transition-colors">Layanan</a>
            <span className="h-4 w-px bg-slate-800"></span>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 hover:border-[#CC0000] text-slate-200 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-red-900/20"
            >
              <LogIn size={14} className="text-[#CC0000]" />
              Login Portal Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#CC0000]/10 to-[#FFB800]/10 border border-[#CC0000]/30 text-[#FFB800] text-[11px] font-extrabold px-4 py-2 rounded-full tracking-wider uppercase backdrop-blur-sm animate-pulse">
              <Sparkles size={12} className="text-[#CC0000]" />
              AI-Powered Virtual Assistant &middot; Aktif 24 Jam
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Navigasi Layanan <br />
              <span className="bg-gradient-to-r from-[#CC0000] via-[#FF3333] to-[#FFB800] bg-clip-text text-transparent">
                SSC Jadi Lebih Pintar
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
              Sistem asisten pintar berbasis kecerdasan buatan dirancang khusus untuk mempermudah civitas akademika Telkom University Surabaya dalam memproses administrasi surat-menyurat, validasi TOSS, hingga peminjaman fasilitas logistik secara instan.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/chat"
                className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#CC0000] to-[#E60000] text-white text-sm font-extrabold px-8 py-4 rounded-xl shadow-xl shadow-red-900/30 hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <MessageCircle size={18} className="animate-bounce" />
                Mulai Percakapan Sekarang
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <Link
                href="/login"
                className="md:hidden flex items-center justify-center gap-2 bg-slate-900 text-slate-300 text-sm font-extrabold px-8 py-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
              >
                Portal Admin Login
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-10 border-t border-slate-800/60 grid grid-cols-3 gap-4 max-w-lg">
              {STATS.map((stat, i) => (
                <div key={i} className="group">
                  <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#FFB800] transition-colors">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Right Content - Interactive Mock Dashboard/Chat Visual */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#CC0000]/20 to-[#FFB800]/20 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
              {/* Card Window Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500 block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono tracking-widest bg-slate-950 px-3 py-1 rounded-md border border-slate-800/80">
                  SSC-BOT
                </div>
              </div>

              {/* Chat Simulation Blocks */}
              <div className="space-y-4 min-h-[220px] flex flex-col justify-end text-xs">
                <div className="self-end max-w-[80%] bg-[#CC0000] text-white p-3 rounded-2xl rounded-tr-none shadow-md font-medium">
                  Bagaimana tata cara mengajukan Surat Keterangan Aktif Mahasiswa?
                </div>
                <div className="self-start max-w-[85%] bg-slate-800 text-slate-200 p-3.5 rounded-2xl rounded-tl-none border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#FFB800] font-bold text-[10px] uppercase tracking-wider">
                    <Zap size={10} /> SSC Smart Agent
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    Halo Rek! Pengajuan surat keterangan aktif bisa diselesaikan lewat portal <strong>TOSS</strong> dengan alur berikut:
                  </p>
                  <ul className="space-y-1 text-slate-400 pl-1">
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> 1. Login Akun TOSS</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> 2. Pilih Menu Persuratan Akademik</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> 3. Isi form data wali mahasiswa</li>
                  </ul>
                </div>
              </div>

              {/* Input Action Mock */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-slate-500 text-xs flex-1 flex items-center justify-between">
                  <span>Ketik pertanyaan Anda di sini...</span>
                  <HelpCircle size={14} className="text-slate-600" />
                </div>
                <div className="w-10 h-10 bg-[#CC0000] rounded-xl flex items-center justify-center text-white shadow-md">
                  <MessageCircle size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid Section */}
        <div id="fitur" className="mt-32 w-full relative z-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#FFB800] mb-2 bg-amber-500/10 px-3 py-1 rounded-full inline-block">
              Direktori Integrasi Sistem
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Akselerasi Informasi Layanan Kampus
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Asisten Virtual kami dilatih secara intensif memandu Anda melewati ragam framework regulasi birokrasi kampus secara seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-[#CC0000]/60 hover:from-slate-900/80 hover:to-slate-900 shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 bg-gradient-to-br from-red-950 to-slate-900 border border-red-900/50 rounded-xl flex items-center justify-center transition-colors group-hover:from-[#CC0000] group-hover:to-red-700">
                        <Icon size={18} className="text-[#CC0000] group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 group-hover:border-[#CC0000]/30 group-hover:text-slate-300 transition-colors">
                        {f.tag}
                      </span>
                    </div>
                    
                    <p className="text-base font-bold text-white tracking-wide leading-snug group-hover:text-[#FFB800] transition-colors">
                      {f.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-medium">
                      {f.desc}
                    </p>
                  </div>

                  {/* <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 group-hover:text-white transition-colors">
                    <span>Pelajari Alur</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                  </div> */}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Element */}
      <footer className="relative z-10 text-center pt-8 pb-12 border-t border-slate-900/80 bg-slate-950/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
            &copy; 2026 Student Service Center &bull; Telkom University Surabaya
          </p>
          <div className="flex items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
           
          </div>
        </div>
      </footer>
    </div>
  );
}