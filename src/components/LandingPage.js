"use client";

import { signIn } from "next-auth/react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Globe, BarChart3, Bot, Rocket, ChevronRight, Star } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const FEATURES = [
  {
    icon: Bot,
    title: "IA Product Finder",
    desc: "Trouvez automatiquement les produits gagnants grâce à notre intelligence artificielle de pointe.",
    color: "#8b5cf6"
  },
  {
    icon: Rocket,
    title: "Store Builder IA",
    desc: "Générez des boutiques Shopify complètes en un clic avec des landing pages optimisées pour la conversion.",
    color: "#3b82f6"
  },
  {
    icon: BarChart3,
    title: "Ad Strategy IA",
    desc: "Créez des stratégies publicitaires personnalisées pour TikTok, Meta et Pinterest en quelques secondes.",
    color: "#ec4899"
  },
  {
    icon: ShieldCheck,
    title: "Sync Automatique",
    desc: "Synchronisez vos produits, stocks et commandes directement avec votre boutique Shopify.",
    color: "#10b981"
  },
];

const STATS = [
  { value: 2847, suffix: "+", label: "Produits analysés" },
  { value: 156, suffix: "+", label: "Boutiques créées" },
  { value: 98, suffix: "%", label: "Taux de satisfaction" },
  { value: 24, suffix: "/7", label: "Support IA" },
];

const TESTIMONIALS = [
  { name: "Sophie M.", role: "Dropshippeuse", text: "DropX AI a transformé mon business. J'ai multiplié mes revenus par 3 en seulement 2 mois !", rating: 5 },
  { name: "Karim D.", role: "E-commerçant", text: "L'IA trouve des produits gagnants que je n'aurais jamais trouvé seul. Un outil indispensable.", rating: 5 },
  { name: "Léa T.", role: "Freelance", text: "La génération de boutiques est incroyable. En 5 minutes, j'ai une boutique prête à vendre.", rating: 5 },
];

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030014', color: '#fff', fontFamily: 'var(--font-family)', overflow: 'hidden' }}>

      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px', textAlign: 'center' }}>

        {/* Animated background orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'orbFloat 12s ease-in-out infinite', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'orbFloat 15s ease-in-out infinite reverse', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '40%', right: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)', filter: 'blur(40px)', animation: 'orbFloat 10s ease-in-out infinite 2s', pointerEvents: 'none' }}></div>

        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '900px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 22px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.1))', borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '40px', animation: 'fadeInUp 0.6s ease forwards', backdropFilter: 'blur(10px)' }}>
            <Sparkles size={16} color="#a78bfa" />
            <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '1.5px', background: 'linear-gradient(90deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PROPULSÉ PAR L'IA</span>
          </div>

          {/* Main title */}
          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-3px', marginBottom: '28px', animation: 'fadeInUp 0.8s ease forwards 0.1s', opacity: 0 }}>
            Générez votre empire <br />
            <span style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 25%, #3b82f6 50%, #ec4899 75%, #8b5cf6 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradientShift 4s ease infinite' }}>en quelques clics.</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: '1.6', animation: 'fadeInUp 0.8s ease forwards 0.2s', opacity: 0 }}>
            L'intelligence artificielle au service de votre rentabilité. Trouvez des produits gagnants, générez vos boutiques et lancez vos pubs automatiquement.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.8s ease forwards 0.3s', opacity: 0 }}>
            <button
              onClick={() => window.location.href = '/register'}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', color: '#fff', padding: '18px 44px', borderRadius: '14px', fontSize: '18px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease', boxShadow: '0 8px 40px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.1)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 50px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.1)'; }}
            >
              Commencer gratuitement <ArrowRight size={20} />
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '18px 44px', borderRadius: '14px', fontSize: '18px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: '48px', marginTop: '80px', zIndex: 2, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeInUp 0.8s ease forwards 0.5s', opacity: 0 }}>
          {[
            { icon: ShieldCheck, text: '100% Sécurisé', color: '#10b981' },
            { icon: Zap, text: 'Ultra Rapide', color: '#f59e0b' },
            { icon: Globe, text: 'Déploiement Mondial', color: '#3b82f6' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: `${item.color}15`, borderRadius: '10px', border: `1px solid ${item.color}20` }}>
                <item.icon size={20} color={item.color} />
              </div>
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section style={{ padding: '60px 20px 80px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          {STATS.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '32px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <h3 style={{ fontSize: '36px', fontWeight: '800', background: 'linear-gradient(135deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section style={{ padding: '80px 20px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>FONCTIONNALITÉS</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', letterSpacing: '-1.5px', lineHeight: '1.1' }}>
              Tout ce dont vous avez besoin<br />
              <span style={{ color: '#64748b' }}>pour réussir en dropshipping.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  style={{
                    padding: '36px 28px',
                    background: hoveredFeature === i ? `${feature.color}08` : 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: `1px solid ${hoveredFeature === i ? feature.color + '25' : 'rgba(255,255,255,0.05)'}`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default',
                    transform: hoveredFeature === i ? 'translateY(-6px)' : 'translateY(0)',
                  }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${feature.color}15`, border: `1px solid ${feature.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', transition: 'all 0.3s ease', boxShadow: hoveredFeature === i ? `0 0 30px ${feature.color}20` : 'none' }}>
                    <Icon size={24} color={feature.color} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.3px' }}>{feature.title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section style={{ padding: '80px 20px 120px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', color: '#ec4899', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>TÉMOIGNAGES</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', letterSpacing: '-1.5px' }}>
              Ils nous font confiance.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '24px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{t.name}</p>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section style={{ padding: '80px 20px 120px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '64px 40px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.05))', borderRadius: '32px', border: '1px solid rgba(139, 92, 246, 0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 50%)', animation: 'orbFloat 8s ease-in-out infinite', pointerEvents: 'none' }}></div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '16px', position: 'relative' }}>
            Prêt à commencer ?
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '36px', position: 'relative' }}>
            Rejoignez des centaines d'entrepreneurs qui utilisent DropX AI pour automatiser leur business.
          </p>
          <button
            onClick={() => window.location.href = '/register'}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '18px 48px', borderRadius: '14px', fontSize: '18px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease', boxShadow: '0 8px 40px rgba(99, 102, 241, 0.35)', position: 'relative' }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 50px rgba(99, 102, 241, 0.5)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(99, 102, 241, 0.35)'; }}
          >
            Lancer mon business <Rocket size={20} />
          </button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <p style={{ fontSize: '13px', color: '#475569' }}>© 2026 DropX AI. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
