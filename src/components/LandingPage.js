"use client";

import { signIn } from "next-auth/react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'var(--font-family)' }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

      <div style={{ zIndex: 1, textAlign: 'center', maxWidth: '800px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' }}>
          <Sparkles size={16} color="#fff" />
          <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '1px' }}>LE FUTUR DU DROPSHIPPING</span>
        </div>

        <h1 style={{ fontSize: '64px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-2px', marginBottom: '24px' }}>
          Générez votre empire <br />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>en quelques clics.</span>
        </h1>

        <p style={{ fontSize: '20px', color: '#a1a1aa', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: '1.5' }}>
          L'intelligence artificielle au service de votre rentabilité. Trouvez des produits gagnants, générez vos boutiques et lancez vos pubs automatiquement.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            onClick={() => window.location.href = '/register'}
            style={{ background: '#fff', color: '#000', padding: '16px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease', boxShadow: '0 4px 30px rgba(255,255,255,0.15)' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            S'inscrire <ArrowRight size={20} />
          </button>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{ background: 'transparent', color: '#fff', padding: '16px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';}}
            onMouseOut={(e) => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';}}
          >
            Se connecter
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', marginTop: '100px', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa' }}>
          <ShieldCheck size={24} color="#fff" />
          <span style={{ fontSize: '15px' }}>100% Sécurisé</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa' }}>
          <Zap size={24} color="#fff" />
          <span style={{ fontSize: '15px' }}>Ultra Rapide</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa' }}>
          <Globe size={24} color="#fff" />
          <span style={{ fontSize: '15px' }}>Déploiement Mondial</span>
        </div>
      </div>
    </div>
  );
}
