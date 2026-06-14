'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState('Selamat');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isFocused, setIsFocused] = useState({ user: false, pass: false });
  
  const router = useRouter();

  // Fitur Human Touch - Ucapan Otomatis Berdasarkan Waktu Riil
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setGreeting('Selamat Pagi');
    else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  const triggerNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (username === 'admin_ssc' && password === 'admin123') {
        document.cookie = 'admin_token=is_authenticated; path=/; max-age=3600; SameSite=Strict';
        triggerNotification('Akses diterima. Membuka gerbang dasbor...', 'success');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        triggerNotification('Kredensial ditolak. Periksa kembali kombinasi nama pengguna dan sandi.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-0 sm:p-6 md:p-12 relative font-sans overflow-x-hidden select-none">
      
      {/* ── ARSITEKTUR LATAR BELAKANG GEOMETRIS (LIGHT RED PATTERN) ── */}
      <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#CC0000]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#CC0000]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* ── TOAST NOTIFICATION PREMIUM FLOATING ── */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl border bg-white/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(204,0,0,0.1)] animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'border-emerald-200 text-emerald-700 shadow-emerald-100/40' 
            : 'border-red-200 text-[#CC0000] shadow-red-100/40'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-[#CC0000]'} animate-pulse`} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifikasi Sistem</span>
            <p className="text-sm font-semibold text-slate-700">{notification.message}</p>
          </div>
        </div>
      )}

      {/* ── KANVAS STRUKTUR UTAMA (FRAME INTEGRASI RED-LIGHT) ── */}
      <div className="w-full max-w-6xl min-h-[720px] bg-white border border-slate-200/80 rounded-none sm:rounded-[2.5rem] shadow-[0_30px_80px_rgba(204,0,0,0.06)] overflow-hidden flex flex-col lg:flex-row z-10 relative">
        
        {/* PANEL KIRI: EDITORIAL RED BRANDING & FRAME FOTO */}
        <div className="w-full lg:w-[46%] bg-gradient-to-br from-[#E60000] via-[#CC0000] to-[#990000] p-8 sm:p-12 flex flex-col justify-between relative min-h-[400px] lg:min-h-auto text-white">
          
          {/* Ornamen Garis Estetik Khas Desain Editorial */}
          <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Top Info Branding */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-white text-[#CC0000] font-black tracking-[0.2em] px-2.5 py-1 rounded shadow-sm">INTEGRATED</span>
              <span className="text-xs font-bold text-red-100 uppercase tracking-widest opacity-90">SSC PANEL v2.4</span>
            </div>
            <div className="text-[10px] text-red-200 font-mono bg-red-800/30 px-3 py-1 rounded-full border border-white/10">SYS_ACTIVE</div>
          </div>

          {/* Wadah Frame Foto Utama dengan Efek Clean Frame */}
          <div className="my-auto relative w-full h-[200px] lg:h-[360px] rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl bg-red-950 group z-10">
            {/* Foto dari folder public/img/ssc.webp */}
            <Image 
              src="/img/ssc.webp" 
              alt="Student Service Center Telkom University" 
              fill
              priority
              className="object-cover object-center contrast-[1.05] brightness-95 transition-transform duration-[5000ms] ease-out scale-100 group-hover:scale-105"
            />
            {/* Gradient Overlay Elegan (Light Red Masking) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#990000]/60 via-transparent to-black/10 z-10"></div>
            
            {/* Indikator Pojok Kamera Rekayasa Geometris */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/40"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/40"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/40"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/40"></div>
          </div>

          {/* Deskripsi Atribut Bawah */}
          <div className="relative z-10 space-y-3">
            <div className="w-16 h-1.5 bg-white rounded-full"></div>
            <h2 className="text-2xl font-black tracking-tight uppercase leading-tight">
              Student Service Center <br />
              <span className="text-red-200 font-medium text-xl normal-case tracking-normal">Telkom University Surabaya</span>
            </h2>
            <p className="text-xs text-red-100/80 font-medium leading-relaxed max-w-sm">
              Sistem gerbang otentikasi terpusat untuk manajemen administrasi, data transaksional, dan integrasi layanan akademik mahasiswa.
            </p>
          </div>
        </div>

        {/* PANEL KANAN: FORM KENDALI INPUT UTAMA */}
        <div className="w-full lg:w-[54%] p-8 sm:p-12 lg:p-20 flex flex-col justify-between bg-white">
          
          {/* Header Identitas Institusi */}
          <div className="flex items-center gap-4 mb-12 lg:mb-0">
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
              <h3 className="font-black text-sm tracking-wider uppercase text-slate-900 leading-none mb-1">Telkom University</h3>
              <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Surabaya Campus Portal</p>
            </div>
          </div>

          {/* Form Utama Wrapper */}
          <div className="my-auto py-6">
            <div className="mb-10 space-y-1">
              <span className="text-xs font-bold text-[#CC0000] tracking-widest uppercase block">{greeting}, Admin</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                Masuk Dashboard<span className="text-[#CC0000]">.</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium pt-1">
                Silakan isi kredensial otoritas Anda untuk memverifikasi hak akses log data.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Input Group: Username */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                    ID Pengguna / Username
                  </label>
                  {username && <span className="text-[9px] font-mono font-bold text-[#CC0000] bg-red-50 px-2 py-0.5 rounded animate-pulse">SEDANG MENULIS</span>}
                </div>
                <div className={`relative border-2 rounded-xl transition-all duration-300 flex items-center ${
                  isFocused.user ? 'border-[#CC0000] bg-white shadow-[0_4px_20px_rgba(204,0,0,0.05)]' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <span className={`absolute left-4 transition-colors duration-300 ${isFocused.user ? 'text-[#CC0000]' : 'text-slate-400'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onFocus={() => setIsFocused({...isFocused, user: true})}
                    onBlur={() => setIsFocused({...isFocused, user: false})}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan ID Operator (ex: admin_ssc)"
                    className="w-full pl-12 pr-4 py-4 bg-transparent text-sm text-slate-800 font-semibold placeholder-slate-400 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Input Group: Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                    Kata Sandi Otentikasi
                  </label>
                  <span className="text-[11px] text-[#CC0000] hover:text-red-800 font-bold transition-colors cursor-pointer">Lupa Akses?</span>
                </div>
                <div className={`relative border-2 rounded-xl transition-all duration-300 flex items-center ${
                  isFocused.pass ? 'border-[#CC0000] bg-white shadow-[0_4px_20px_rgba(204,0,0,0.05)]' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <span className={`absolute left-4 transition-colors duration-300 ${isFocused.pass ? 'text-[#CC0000]' : 'text-slate-400'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onFocus={() => setIsFocused({...isFocused, pass: true})}
                    onBlur={() => setIsFocused({...isFocused, pass: false})}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-sm text-slate-800 font-semibold placeholder-slate-400 outline-none tracking-widest"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Trigger Action (Glow Crimson Button) */}
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full relative overflow-hidden bg-[#CC0000] hover:bg-[#A30000] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(204,0,0,0.15)] disabled:shadow-none mt-8 border border-red-700/20"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/>
                    </svg>
                    <span>Memverifikasi Otoritas...</span>
                  </>
                ) : (
                  <>
                    <span>Aktivasi Sesi Masuk</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Kaki Dokumen Lisensi Resmi */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-6 text-[10px] text-slate-400 font-semibold tracking-wide gap-2">
            <p>&copy; 2026 Telkom University Surabaya. Tata Kelola TI Pusat.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-600 cursor-pointer">Protokol Keamanan</span>
              <span>&bull;</span>
              <span className="hover:text-slate-600 cursor-pointer">Syarat Penggunaan</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}