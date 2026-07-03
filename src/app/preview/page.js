"use client";

import { useEffect, useState } from 'react';
import { ShoppingBag, Star, ShieldCheck, Truck, ArrowLeft, Plus, Minus, Check, Heart, Zap, Wind, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PreviewStore() {
  const router = useRouter();
  
  const defaultImages = [
    'https://images.unsplash.com/photo-1583947581924-860bda6a5e0e?w=800&q=80',
    'https://images.unsplash.com/photo-1528313437190-302a90da30d5?w=800&q=80',
    'https://images.unsplash.com/photo-1626226190740-410ce4416bbd?w=800&q=80',
    'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=800&q=80'
  ];

  const [product, setProduct] = useState({
    title: 'Déshumidificateur Électrique: Air Pur, Confort Optimal!',
    description: "Découvrez notre produit révolutionnaire généré par l'IA. Un design parfait, une utilité prouvée, testé et approuvé par des milliers de clients satisfaits.",
    images: defaultImages,
    price: 49.99,
    compareAtPrice: 79.99
  });

  const [bundle, setBundle] = useState(1);
  const [currency, setCurrency] = useState('EUR'); // EUR, XOF, USD
  const [openFaq, setOpenFaq] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Push State
  const [pushStatus, setPushStatus] = useState('idle'); // idle, pushing, success, error
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('dropx_preview_product');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 1. Détection de la devise originale de l'IA
        let originalCurrency = 'USD';
        if (parsed.price) {
          const upperP = String(parsed.price).toUpperCase();
          if (upperP.includes('XOF') || upperP.includes('CFA')) originalCurrency = 'XOF';
          else if (upperP.includes('EUR') || upperP.includes('€')) originalCurrency = 'EUR';
        }

        const parseRobust = (p) => {
          if (!p) return 49.99;
          let s = String(p).replace(/[^0-9.,]/g, '');
          if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
          else if (s.includes(',')) {
            const pts = s.split(',');
            s = pts[pts.length-1].length === 3 ? s.replace(/,/g, '') : s.replace(/,/g, '.');
          }
          return parseFloat(s) || 49.99;
        };
        const basePriceOrig = parseRobust(parsed.price);
        
        // 2. Devise cible imposée : USD (comme demandé par l'utilisateur)
        let targetCurrency = 'USD';

        // 3. Conversion mathématique (Sans inflation car on ne donne plus de produit gratuit sur la première option)
        let finalPrice = basePriceOrig;
        if (originalCurrency !== targetCurrency) {
          const rates = {
            'EUR_XOF': 655.957, 'XOF_EUR': 1 / 655.957,
            'EUR_USD': 1.08, 'USD_EUR': 1 / 1.08,
            'USD_XOF': 605.0, 'XOF_USD': 1 / 605.0
          };
          const rate = rates[`${originalCurrency}_${targetCurrency}`] || 1;
          finalPrice = targetCurrency === 'XOF' ? Math.round(basePriceOrig * rate) : Math.round(basePriceOrig * rate * 100) / 100;
        }

        setCurrency(targetCurrency);
        setProduct({
          ...product,
          title: parsed.title || product.title,
          description: parsed.description || "Découvrez notre produit révolutionnaire généré par l'IA. Un design parfait, une utilité prouvée, testé et approuvé par des milliers de clients satisfaits.",
          images: parsed.images && parsed.images.length > 0 ? parsed.images : (parsed.image ? [parsed.image, ...defaultImages.slice(1)] : defaultImages),
          price: finalPrice,
          compareAtPrice: targetCurrency === 'XOF' ? Math.round(finalPrice * 1.6) : Math.round(finalPrice * 1.6 * 100) / 100,
          landingPage: parsed.landingPage || {}
        });
      } catch (e) {}
    }
  }, []);

  const formatPrice = (price) => {
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(price);
  };

  const handleCurrencyChange = (newCurrency) => {
    if (currency === newCurrency) return;
    
    // Taux de conversion approximatifs
    const rates = {
      'EUR_XOF': 655.957,
      'XOF_EUR': 1 / 655.957,
      'EUR_USD': 1.08,
      'USD_EUR': 1 / 1.08,
      'USD_XOF': 605.0,
      'XOF_USD': 1 / 605.0
    };

    const rateKey = `${currency}_${newCurrency}`;
    const rate = rates[rateKey] || 1;
    
    // Si on passe en XOF, on arrondit à l'entier. Sinon à 2 décimales.
    const newPrice = newCurrency === 'XOF' ? Math.round(product.price * rate) : Math.round(product.price * rate * 100) / 100;
    const newCompare = newCurrency === 'XOF' ? Math.round(product.compareAtPrice * rate) : Math.round(product.compareAtPrice * rate * 100) / 100;

    setProduct({
      ...product,
      price: newPrice,
      compareAtPrice: newCompare
    });
    setCurrency(newCurrency);
  };

  // Algorithme de Smart Bundles (Rentable Classique)
  const generateSmartBundles = (basePrice, comparePrice) => {
    const safeCompare = comparePrice > basePrice ? comparePrice : basePrice * 2.8;
    return [
      { 
        id: 1, 
        title: "Pack Découverte (1 Unité)", 
        desc: `ÉCONOMISEZ ${Math.round((1 - basePrice / safeCompare) * 100)}%`,
        price: basePrice, 
        oldPrice: safeCompare, 
        tag: "" 
      },
      { 
        id: 2, 
        title: "2 Achetés = 1 OFFERT", 
        desc: `Vous recevez 3 unités au total !`,
        price: basePrice * 2, 
        oldPrice: safeCompare * 3, 
        tag: "Le plus populaire" 
      },
      { 
        id: 3, 
        title: "3 Achetés = 2 OFFERTS", 
        desc: `Vous recevez 5 unités au total !`,
        price: basePrice * 3, 
        oldPrice: safeCompare * 5, 
        tag: "Meilleure vente" 
      }
    ];
  };

  const smartBundles = generateSmartBundles(product.price, product.compareAtPrice);

  const handlePushToShopify = async () => {
    setPushStatus('pushing');
    setPushMessage('');

    try {
      const res = await fetch('/api/shopify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, currency })
      });
      const data = await res.json();

      if (res.ok) {
        setPushStatus('success');
        setPushMessage('Produit synchronisé avec succès sur votre boutique Shopify !');
        setTimeout(() => setPushStatus('idle'), 4000);
      } else {
        setPushStatus('error');
        setPushMessage(data.error || 'Erreur lors de la synchronisation.');
        setTimeout(() => setPushStatus('idle'), 4000);
      }
    } catch (err) {
      setPushStatus('error');
      setPushMessage('Erreur de connexion au serveur.');
      setTimeout(() => setPushStatus('idle'), 4000);
    }
  };

  const faqs = [
    { q: "Ce déshumidificateur est-il bruyant ?", a: "Non, il est conçu avec une technologie ultra-silencieuse pour ne pas perturber votre sommeil ou votre travail." },
    { q: "Quelle est la capacité de déshumidification ?", a: "Il performe de manière optimale pour les pièces jusqu'à 20m², créant un environnement toujours frais et agréable." },
    { q: "Est-ce difficile à utiliser ou à entretenir ?", a: "Très simple ! Un seul bouton pour l'allumer, et le réservoir se vide facilement en quelques secondes." }
  ];

  const reviews = [
    { name: "Sophie L.", time: "Il y a 2 jours", text: "Je ne pensais pas qu'un si petit appareil pouvait faire une si grande différence ! Mon appartement est transformé." },
    { name: "Chloé R.", time: "Il y a 1 semaine", text: "Quel bonheur de rentrer chez soi et de sentir un air pur ! Cet appareil a résolu tous mes soucis d'humidité." }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#000', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* BUILDER NAVIGATION BAR (DROPX UI) */}
      <div style={{ background: '#090a0f', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/analyzer')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>Mode Aperçu - Vibe Store</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {pushStatus === 'success' && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold' }}>
              <Check size={18} /> {pushMessage}
            </span>
          )}
          {pushStatus === 'error' && (
            <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>{pushMessage}</span>
          )}
          <button 
            onClick={handlePushToShopify} 
            disabled={pushStatus === 'pushing'}
            style={{ 
              background: pushStatus === 'pushing' ? '#059669' : '#10b981', 
              color: '#fff', 
              border: 'none', 
              padding: '8px 20px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: pushStatus === 'pushing' ? 'not-allowed' : 'pointer', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {pushStatus === 'pushing' ? <Loader2 size={16} className="animate-spin" /> : null}
            {pushStatus === 'pushing' ? 'Export en cours...' : 'Pousser vers Shopify'}
          </button>
        </div>
      </div>

      {/* ANNOUNCEMENT BAR */}
      <div style={{ background: '#000', color: '#fff', textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: '500', letterSpacing: '1px' }}>
        Livraison rapide 🚚
      </div>

      {/* HEADER */}
      <header style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Logo</h1>
        <ShoppingBag size={24} strokeWidth={1.5} />
      </header>

      {/* HERO SECTION */}
      <main style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
        
        {/* Left: Interactive Image Gallery */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Image */}
          <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #eaeaea' }}>
            <img src={product.images[0]} alt="Product Main" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '24px' }} />
          </div>
          {/* Dropmagic Grid Gallery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {product.images.slice(1).map((img, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: '100%', 
                  aspectRatio: '1/1', 
                  borderRadius: '12px', 
                  border: '1px solid #eaeaea', 
                  background: '#f9f9f9', 
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <img src={img} alt={`Gallery Image ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Info & Buy Box */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Haute Qualité</p>
          <textarea 
            value={product.title}
            onChange={(e) => setProduct({...product, title: e.target.value})}
            style={{ 
              fontSize: '32px', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px',
              width: '100%', border: '1px dashed #ccc', padding: '12px', borderRadius: '8px', background: '#fafafa', resize: 'vertical'
            }}
            rows={2}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fce7f3', padding: '4px 12px', borderRadius: '8px', border: '1px dashed #c85a7c' }}>
              <select 
                value={currency} 
                onChange={(e) => handleCurrencyChange(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#c85a7c', fontWeight: 'bold', fontSize: '20px', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="EUR">€</option>
                <option value="USD">$</option>
                <option value="XOF">FCFA</option>
              </select>
              <input 
                type="number" 
                value={product.price}
                onChange={(e) => setProduct({...product, price: parseFloat(e.target.value) || 0})}
                style={{ fontSize: '24px', fontWeight: 'bold', color: '#c85a7c', background: 'transparent', border: 'none', outline: 'none', width: currency === 'XOF' ? '120px' : '90px', paddingLeft: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f9f9f9', padding: '4px 12px', borderRadius: '8px', border: '1px dashed #ccc' }}>
              <span style={{ color: '#999', fontSize: '18px' }}>{currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'FCFA'}</span>
              <input 
                type="number" 
                value={product.compareAtPrice}
                onChange={(e) => setProduct({...product, compareAtPrice: parseFloat(e.target.value) || 0})}
                style={{ fontSize: '18px', color: '#999', textDecoration: 'line-through', background: 'transparent', border: 'none', outline: 'none', width: currency === 'XOF' ? '90px' : '70px', paddingLeft: '8px' }}
              />
            </div>
            <span style={{ background: '#fce7f3', color: '#c85a7c', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              Économisez {Math.round((1 - product.price/product.compareAtPrice)*100) || 0}%
            </span>
          </div>

          <textarea 
            value={product.description}
            onChange={(e) => setProduct({...product, description: e.target.value})}
            style={{ 
              color: '#555', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px',
              width: '100%', border: '1px dashed #ccc', padding: '12px', borderRadius: '8px', background: '#fafafa', resize: 'vertical'
            }}
            rows={4}
          />

          {/* SMART BUNDLE OPTIONS (Dropmagic Style) */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>BUNDLE & ÉCONOMIES</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {smartBundles.map(opt => (
                <label key={opt.id} onClick={() => setBundle(opt.id)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: bundle === opt.id ? '2px solid #16a34a' : '1px solid #eaeaea', borderRadius: '4px', cursor: 'pointer', background: bundle === opt.id ? '#fdf2f8' : '#fff', transition: 'all 0.2s' }}>
                  {opt.tag && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#c85a7c', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>{opt.tag}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: bundle === opt.id ? '2px solid #111' : '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {bundle === opt.id && <div style={{width: '8px', height: '8px', background: '#111', borderRadius: '50%'}}></div>}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>{opt.title}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{opt.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#111' }}>{formatPrice(opt.price)}</div>
                    <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>{formatPrice(opt.oldPrice)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ADD TO CART BUTTON */}
          <button style={{ width: '100%', background: '#000', color: '#fff', padding: '18px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '12px', transition: 'transform 0.1s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }} onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            <ShoppingBag size={20} /> Ajouter au Panier
          </button>

          {/* Trust Badges */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9f9f9', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid #eaeaea' }}>
              <ShieldCheck size={20} color="#000" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Essai 30 Jours</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Satisfait ou remboursé</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9f9f9', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid #eaeaea' }}>
              <Truck size={20} color="#000" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Livraison Rapide</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Expédié en 24/48h</div>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
