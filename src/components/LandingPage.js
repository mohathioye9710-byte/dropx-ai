"use client";

import { Star, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPage() {
  const router = useRouter();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { lang, setLang, t, languages: LANGUAGES } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', color: '#ffffff', fontFamily: 'var(--font-family)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      
      {/* ============ NAVBAR ============ */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', position: 'relative', zIndex: 100 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="DropX Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
          <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0, cursor: 'pointer' }}>
            DropX
          </h1>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '40px' }}>
          <Link href="/inspirations" style={{ color: '#a1a1aa', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#a1a1aa'}>{t.nav1}</Link>
          <Link href="/affiliation" style={{ color: '#a1a1aa', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#a1a1aa'}>{t.nav2}</Link>
          <Link href="/tutoriels" style={{ color: '#a1a1aa', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#a1a1aa'}>{t.nav3}</Link>
        </nav>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowLangMenu(!showLangMenu)} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Globe size={14} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{lang}</span>
              <ChevronDown size={14} />
            </div>
            
            {showLangMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', minWidth: '140px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 50, maxHeight: '350px', overflowY: 'auto' }}>
                {LANGUAGES.map(l => (
                  <button 
                    key={l}
                    onClick={() => { setLang(l); setShowLangMenu(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: lang === l ? 'rgba(255,255,255,0.05)' : 'transparent', color: lang === l ? '#fff' : '#a1a1aa', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { if (lang !== l) { e.target.style.background = 'rgba(255,255,255,0.02)'; e.target.style.color = '#fff'; } }}
                    onMouseOut={(e) => { if (lang !== l) { e.target.style.background = 'transparent'; e.target.style.color = '#a1a1aa'; } }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href="/login" style={{ color: '#a1a1aa', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s', textDecoration: 'none' }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = '#a1a1aa'}
          >
            {t.login}
          </Link>
          <button 
            onClick={() => router.push('/register')}
            style={{ background: '#ffffff', color: '#000000', padding: '10px 20px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.target.style.background = '#e5e5e5'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
          >
            {t.start}
          </button>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', zIndex: 10 }}>
        
        {/* Rating Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#10b981" color="#10b981" />)}
          </div>
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px' }}>
            {t.badge}
          </span>
        </div>

        {/* Main Title */}
        <h2 style={{ fontSize: 'clamp(48px, 8vw, 84px)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-3px', marginBottom: '24px', maxWidth: '800px', margin: '0 auto 24px' }}>
          {t.title}
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#a1a1aa', marginBottom: '48px', maxWidth: '650px', margin: '0 auto 48px', lineHeight: '1.6', fontWeight: '400' }}>
          {t.sub}
        </p>

        {/* Big CTA */}
        <button 
          onClick={() => router.push('/register')}
          style={{ background: '#ffffff', color: '#000000', padding: '16px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: '700', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(255,255,255,0.1)' }}
          onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 24px rgba(255,255,255,0.15)'; }}
          onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(255,255,255,0.1)'; }}
        >
          {t.start}
        </button>

      </main>

      {/* Subtle bottom fade for depth */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '30vh', background: 'linear-gradient(to top, rgba(25,25,25,0.8), transparent)', pointerEvents: 'none', zIndex: 0 }}></div>
      
      {/* Footer */}
      <footer style={{ padding: '60px 20px', textAlign: 'center', color: '#a1a1aa', fontSize: '14px', zIndex: 10, position: 'relative', marginTop: 'auto' }}>
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
