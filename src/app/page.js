"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, ArrowRight, Store, Settings, ExternalLink } from 'lucide-react';
import LandingPage from '@/components/LandingPage';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (session) {
      fetch('/api/stores')
        .then(res => res.json())
        .then(data => {
          if (data.generatedStores) {
            // Get the 2 most recent stores
            setStores(data.generatedStores.slice(0, 2));
          }
        })
        .catch(err => console.error("Error fetching stores:", err));
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <LandingPage />;

  const firstName = session.user?.name?.split(' ')[0] || 'User';

  return (
    <div style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '8px' }}>
            Bienvenue, {firstName}
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '15px' }}>
            Prêt à lancer ta prochaine boutique à succès ?
          </p>
        </div>
        <button 
          onClick={() => router.push('/analyzer')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#000', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#f4f4f5'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#fff'; }}
        >
          <Plus size={18} /> Nouvelle boutique
        </button>
      </div>

      {/* Main Promo Card */}
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', right: '-10%', top: '-50%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
        
        <div style={{ maxWidth: '600px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>
            OFFRE SPÉCIALE
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '16px', lineHeight: '1.2' }}>
            Profite de 3 mois de Shopify pour 1€/mois
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Crée ta boutique avec DropX AI et bénéficie de l'offre exclusive partenaire Shopify. Valable sur tes prochaines créations.
          </p>
          <button 
            onClick={() => window.open('https://shopify.pxf.io/dropxai', '_blank')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#000', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e5e5e5'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
          >
            En profiter <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Stores Section */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Vos boutiques</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          
          {stores.map((store, i) => {
            const storeImage = store.metadata?.image || store.metadata?.product?.image || store.metadata?.images?.[0] || null;
            return (
            <div key={i} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
              onClick={() => router.push(`/preview?id=${store.id}`)}
            >
              {/* Product Image Banner */}
              <div style={{ width: '100%', height: '160px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {storeImage ? (
                  <img src={storeImage} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Store size={40} color="#333" />
                )}
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', flex: 1, marginRight: '12px' }}>{store.name}</h4>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px', background: store.status.includes('Publié') ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: store.status.includes('Publié') ? '#10b981' : '#a1a1aa', whiteSpace: 'nowrap' }}>
                    {store.status}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px' }}>{store.niche || "Boutique générée"}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>{store.createdAt}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); router.push('/settings'); }} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><Settings size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/preview?id=${store.id}`); }} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><ExternalLink size={16} /></button>
                </div>
              </div>
            </div>
            </div>
          )})}


          {/* Empty State / Create New */}
          <div 
            onClick={() => router.push('/analyzer')}
            style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Plus size={24} color="#fff" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Créer une boutique</span>
            <span style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>Générée par IA</span>
          </div>

        </div>
      </div>
    </div>
  );
}
