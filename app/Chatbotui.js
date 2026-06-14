'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   FORMATTER PESAN
   Mengubah respons AI (sering berupa satu paragraf panjang berisi
   poin bernomor "1. ... 2. ... 3. ...", **bold**, dan URL polos)
   menjadi list rapi, teks tebal, dan link yang bisa diklik.
   ──────────────────────────────────────────────────────────── */

// Pecah teks panjang jadi baris-baris berdasarkan poin bernomor / bullet,
// tetap menghormati baris baru asli (\n) jika ada.
function splitIntoLines(text) {
  const normalized = text
    // beri baris baru sebelum "1. ", "2. ", dst — kecuali jika di awal teks
    .replace(/(?<!^)(?<=[.\s)])(\d{1,2}\.\s)/g, '\n$1')
    // beri baris baru sebelum bullet "- " atau "• " jika didahului spasi
    .replace(/\s(-|•)\s(?=[A-Za-zÀ-ÿ])/g, '\n$1 ');

  return normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Render satu baris teks: ubah **bold** jadi <strong> dan URL jadi <a>
function renderInline(line, lineIdx) {
  const tokenRegex = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g;
  const parts = line.split(tokenRegex).filter((p) => p !== '');

  return parts.map((part, i) => {
    const key = `${lineIdx}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#CC0000] font-semibold underline underline-offset-2 hover:text-[#A30000] break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function FormattedMessage({ content }) {
  const lines = splitIntoLines(content);

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const numberedMatch = line.match(/^(\d{1,2})\.\s(.*)/);
        const bulletMatch = line.match(/^(-|•)\s(.*)/);

        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 mt-0.5 rounded-md bg-red-50 text-[#CC0000] text-[11px] font-bold flex items-center justify-center">
                {numberedMatch[1]}
              </span>
              <p className="flex-1">{renderInline(numberedMatch[2], idx)}</p>
            </div>
          );
        }

        if (bulletMatch) {
          return (
            <div key={idx} className="flex gap-2.5">
              <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-[#CC0000]" />
              <p className="flex-1">{renderInline(bulletMatch[2], idx)}</p>
            </div>
          );
        }

        return <p key={idx}>{renderInline(line, idx)}</p>;
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   KOMPONEN UTAMA
   ──────────────────────────────────────────────────────────── */

export default function ChatbotUI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya asisten virtual SSC Telkom University Surabaya. Ada yang bisa saya bantu terkait layanan SSC hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`Server merespons dengan status ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error("Error pada fetch /api/chat:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Maaf, terjadi kesalahan koneksi ke server. (${error.message})` }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-sans">

      {/* Container Utama */}
      <div className="w-full max-w-6xl h-[85vh] min-h-[600px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(204,0,0,0.08)] flex overflow-hidden border border-slate-100 z-10 relative">

        {/* ── SIDEBAR PANEL: FOTO KAMPUS CLEAR VIEW & KARTU INFORMASI ── */}
        <div className="hidden md:flex w-[35%] lg:w-[32%] relative flex-col justify-between overflow-hidden border-r border-slate-100">

          {/* BACKGROUND FOTO KAMPUS */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/img/Telkom-University-National-Campus.webp"
              alt="Telkom University National Campus"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 35vw"
              className="object-cover object-center brightness-[0.95] contrast-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20"></div>
          </div>

          {/* KONTEN OVERLAY SIDEBAR */}
          <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">

            {/* Header Atas */}
            <div>
              <div className="flex items-center gap-3 mb-6">
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
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Telkom University</h4>
                  <p className="text-[10px] font-bold tracking-wider text-red-400 uppercase">Surabaya Campus</p>
                </div>
              </div>

              <h2 className="text-2xl font-black tracking-tight leading-tight uppercase drop-shadow-sm">
                SSC Smart <br />
                <span className="text-red-400">Assistant</span>
              </h2>
              <p className="text-slate-200 text-xs font-medium leading-relaxed mt-2 opacity-90">
                Pusat integrasi informasi layanan SSC terpadu berbasis kecerdasan komputasi.
              </p>
            </div>

            {/* Kartu Status Sistem Transparan */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-inner">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">Koneksi Aktif</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">Kanal komunikasi utama AI Engine berjalan optimal.</p>
              </div>

              <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                &copy; 2026 Student Service Center
              </div>
            </div>

          </div>
        </div>

        {/* ── CHAT AREA PANEL (KANAN) ── */}
        <div className="flex-1 flex flex-col bg-white">

          {/* Header Panel Chat */}
          <div className="h-20 px-6 sm:px-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-[#CC0000] rounded-full flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">TOSS Virtual Assistant</h3>
                <p className="text-[11px] text-[#CC0000] font-bold uppercase tracking-wider">Layanan Mandiri Mahasiswa</p>
              </div>
            </div>

            {/* Tombol Kembali ke Landing Page */}
            <Link
              href="/"
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl hover:border-[#CC0000] hover:text-[#CC0000] transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </div>

          {/* List Obrolan */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/40">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar Ikon */}
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                  m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-[#CC0000] text-white'
                }`}>
                  {m.role === 'user' ? 'U' : 'AI'}
                </div>

                {/* Balon Chat Konten */}
                <div className={`max-w-[80%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium ${
                  m.role === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  {m.role === 'assistant'
                    ? <FormattedMessage content={m.content} />
                    : m.content
                  }
                </div>
              </div>
            ))}

            {/* Animasi Mengetik Komponen */}
            {loading && (
              <div className="flex gap-4 flex-row">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#CC0000] text-white flex items-center justify-center font-black text-xs shadow-sm">AI</div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Kontrol */}
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-4 focus:outline-none focus:border-[#CC0000] focus:bg-white transition-all text-slate-700 font-semibold text-sm shadow-inner"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ketik pertanyaan Anda tentang TOSS atau administrasi kampus..."
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="h-14 px-6 bg-[#CC0000] hover:bg-[#A30000] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/10 active:scale-95"
              >
                Kirim
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}