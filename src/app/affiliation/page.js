"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function AffiliationPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '800px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
      
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <button onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '32px', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={16} /> {t.inspBack}
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '100px', color: '#a78bfa', fontSize: '13px', fontWeight: '700', marginBottom: '24px' }}>
          {t.affBadge}
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-2px', marginBottom: '24px' }}>
          {t.affTitle}
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '18px', lineHeight: '1.6', margin: '0 auto' }}>
          {t.affSub}
        </p>
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>{t.affHow}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[t.affStep1, t.affStep2, t.affStep3].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ paddingTop: '6px', color: '#d4d4d8', fontSize: '16px', lineHeight: '1.5' }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button style={{ width: '100%', padding: '20px', background: '#fff', color: '#000', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(255,255,255,0.1)' }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#f4f4f5'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#fff'; }}
      >
        {t.affCta}
      </button>

    </div>
  );
}
