"use client";

import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function TutorielsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Fallback to French if the selected language doesn't have the list translated yet
  const VIDEOS = t.tutorielsList || [
    { title: 'Trouver un produit gagnant en 2026', time: '10 min', tag: 'Recherche', videoId: 'PQhgqpqpJ0w' },
    { title: 'Créer une boutique qui convertit à 5%', time: '30 min', tag: 'Design', videoId: 'eS8CfWmCZG8' },
    { title: 'Configurer son pixel Facebook', time: '12 min', tag: 'Technique', videoId: 'BpbOp7wltyg' },
    { title: 'Lancer sa première campagne Meta Ads', time: '22 min', tag: 'Marketing', videoId: 'hem0yPdADUE' },
    { title: 'Gérer ses commandes automatiquement', time: '15 min', tag: 'Logistique', videoId: 'jK6WHqHfVQw' }
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '60px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
      
      <div style={{ marginBottom: '48px' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={16} /> {t.inspBack}
        </button>
        <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
          {t.tutTitle}
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '18px', maxWidth: '600px', lineHeight: '1.6' }}>
          {t.tutSub}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
        {VIDEOS.map((vid, i) => (
          <div key={i} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer' }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
          >
            <div style={{ width: '100%', height: '200px', background: '#000', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${vid.videoId}?controls=1`} 
                title={vid.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              ></iframe>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.8)', padding: '4px 10px', borderRadius: '100px', color: '#fff', fontSize: '11px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' }}>
                {vid.tag}
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px', lineHeight: '1.4' }}>{vid.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', fontSize: '13px' }}>
                <Clock size={14} /> {vid.time}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
