"use client";

import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function InspirationsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Fallback to French if the selected language doesn't have the list translated yet
  const INSPIRATIONS = t.inspirationsList || [
    { title: 'ZenCare - Correcteur Posture', niche: 'Santé & Bien-être', conv: '4.2%', revenue: '12k€/mois', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800' },
    { title: 'LumiGlow - Lampe', niche: 'Maison & Déco', conv: '3.8%', revenue: '8k€/mois', image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800' },
    { title: 'AquaPure - Gourde', niche: 'Sport & Outdoor', conv: '5.1%', revenue: '15k€/mois', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=800' },
    { title: 'TechNova - Écouteurs', niche: 'High-Tech', conv: '3.5%', revenue: '22k€/mois', image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800' },
    { title: 'KnitCozy - Plaid', niche: 'Maison', conv: '4.8%', revenue: '9k€/mois', image: 'https://images.unsplash.com/photo-1580221371946-b81604a3e74a?q=80&w=800' },
    { title: 'FitBand - Résistance', niche: 'Fitness', conv: '6.2%', revenue: '18k€/mois', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800' }
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
      
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={16} /> {t.inspBack}
        </button>
        <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
          {t.inspTitle}
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '18px', maxWidth: '600px', lineHeight: '1.6' }}>
          {t.inspSub}
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
        {INSPIRATIONS.map((item, i) => (
          <div key={i} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ width: '100%', height: '240px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '100px', color: '#fff', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)' }}>
                {item.niche}
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{item.title}</h3>
                <ExternalLink size={18} color="#a1a1aa" />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>{t.inspConv}</div>
                  <div style={{ fontSize: '16px', color: '#10b981', fontWeight: '700' }}>{item.conv}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>{t.inspRev}</div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '700' }}>{item.revenue}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
