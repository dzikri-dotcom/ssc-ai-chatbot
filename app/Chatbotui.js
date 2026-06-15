'use client';
import { ArrowLeft, Clock, MessageSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/* ────────────────────────────────────────────────────────────
   FORMATTER PESAN
   ──────────────────────────────────────────────────────────── */

function splitIntoLines(text) {
  const normalized = text
    .replace(/(?<!^)(?<=[.\s)])(\d{1,2}\.\s)/g, '\n$1')
    .replace(/\s(-|•)\s(?=[A-Za-zÀ-ÿ])/g, '\n$1 ');

  return normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function renderInline(line, lineIdx) {
  const tokenRegex = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g;
  const parts = line.split(tokenRegex).filter((p) => p !== '');

  return parts.map((part, i) => {
    const key = `${lineIdx}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#CC0000] font-bold underline underline-offset-4 hover:text-[#A30000] break-all transition-colors"
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
    <div className="space-y-3 text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        const numberedMatch = line.match(/^(\d{1,2})\.\s(.*)/);
        const bulletMatch = line.match(/^(-|•)\s(.*)/);

        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 mt-0.5 rounded-lg bg-red-50 text-[#CC0000] text-xs font-black flex items-center justify-center border border-red-100 shadow-sm">
                {numberedMatch[1]}
              </span>
              <p className="flex-1 pt-0.5">{renderInline(numberedMatch[2], idx)}</p>
            </div>
          );
        }

        if (bulletMatch) {
          return (
            <div key={idx} className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 mt-2.5 rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3333] shadow-sm shadow-red-500/50" />
              <p className="flex-1">{renderInline(bulletMatch[2], idx)}</p>
            </div>
          );
        }

        return <p key={idx} className="min-h-[1.5rem]">{renderInline(line, idx)}</p>;
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

  const quickTopics = [
    "Surat Keterangan Aktif Mahasiswa",
    "Surat Dispensasi",
    "Prosedur Peminjaman Unit PuTi",
    "Surat Rekomendasi Beasiswa"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (explicitInput = null) => {
    const textToSend = explicitInput || input;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!explicitInput) setInput('');
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
    // PARENT CONTAINER: Menggunakan flex untuk memusatkan segalanya di tengah layar.
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center p-4 overflow-hidden relative font-sans">
      
      {/* Ornamen Ambient Glow */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#CC0000]/10 to-transparent blur-[120px] pointer-events-none"></div>

      {/* CHAT CONTAINER: 
          Diberi tinggi dinamis h-[85vh] agar selalu proporsional dan berada di tengah,
          tanpa menyentuh pinggiran layar (memberikan breathing room).
      */}
      <div className="w-full max-w-6xl h-[85vh] max-h-[850px] bg-slate-900/40 backdrop-blur-xl rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.7)] flex overflow-hidden border border-slate-800/60 z-10">

        {/* ── PANEL SIDEBAR KIRI ── */}
        <div className="hidden lg:flex w-[32%] relative flex-col justify-between overflow-hidden border-r border-slate-800/80 bg-slate-950/50">
          <div className="absolute inset-0 z-0 opacity-15 mix-blend-overlay">
            <Image
              src="/img/Telkom-University-National-Campus.webp"
              alt="Telkom University Campus"
              fill
              priority
              sizes="32vw"
              className="object-cover object-center scale-105"
            />
          </div>
          
          <div className="relative z-10 p-8 flex flex-col h-full justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-11 h-11 bg-gradient-to-br from-[#CC0000] to-[#E60000] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20 p-2">
                  <Image src="/img/telu.png" alt="Telkom University Logo" width={36} height={36} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/90">Telkom University</h4>
                  <p className="text-[10px] font-extrabold tracking-wider text-red-500 uppercase">Surabaya Campus</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={12} className="animate-pulse" /> AI Support Hub
                </div>
                <h2 className="text-3xl font-black tracking-tight leading-none text-white uppercase">
                  SSC SMART <br />
                  <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">ASSISTANT</span>
                </h2>
                <p className="text-slate-400 text-xs font-medium leading-relaxed pt-1">
                  Sistem integrasi layanan satu pintu bertenaga kecerdasan komputasi.
                </p>
              </div>

              <div className="h-[1px] bg-gradient-to-r from-slate-800 via-slate-700 to-transparent my-6" />

              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                  <MessageSquare size={14} className="text-red-500" /> Topik Populer
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => { if (!loading) { setInput(topic); sendMessage(topic); } }}
                      disabled={loading}
                      className="text-left text-xs bg-slate-900/80 hover:bg-[#CC0000] border border-slate-800 hover:border-red-500 text-slate-300 hover:text-white px-3 py-2.5 rounded-xl transition-all font-semibold active:scale-95 disabled:opacity-50"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 mt-auto">
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-inner space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Sistem Aktif</span>
                  </div>
                  <Clock size={12} className="text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PANEL UTAMA CHAT AREA ── */}
        <div className="flex-1 flex flex-col bg-slate-950/20 relative">
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
            <h3 className="font-black text-white text-sm tracking-wide uppercase">SSC Virtual Assistant</h3>
            <Link href="/" className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95">
              <ArrowLeft size={14} /> Kembali
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3.5 max-w-4xl mx-auto ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-black shadow-md border ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-[#CC0000] text-white'}`}>
                  {m.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`max-w-[80%] px-5 py-4 rounded-2xl text-[14px] ${m.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                  {m.role === 'assistant' ? <FormattedMessage content={m.content} /> : <p>{m.content}</p>}
                </div>
              </div>
            ))}
            {loading && <div className="text-slate-500 text-xs animate-pulse pl-12">AI sedang mengetik...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-900/40 border-t border-slate-800/60">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#CC0000]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Tulis pesan..."
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-6 py-4 bg-[#CC0000] text-white rounded-xl font-bold text-xs uppercase hover:bg-red-700 disabled:bg-slate-700"
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