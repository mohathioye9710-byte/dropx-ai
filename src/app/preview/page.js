"use client";

import { useEffect, useState } from 'react';
import { ShoppingBag, ShieldCheck, Truck, ArrowLeft, Check, Zap, Loader2, LayoutTemplate, Palette, Image as ImageIcon, Settings, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StoreBuilder() {
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
  
  // Builder state
  const [activeTab, setActiveTab] = useState('content'); // content, theme, options
  const [themeColor, setThemeColor] = useState('#000000');
  const [buttonColor, setButtonColor] = useState('#10b981');
  const [pushStatus, setPushStatus] = useState('idle'); // idle, pushing, success, error
  const [pushMessage, setPushMessage] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dropx_preview_product');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
        
        let targetCurrency = 'USD';
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
          description: parsed.description || product.description,
          images: parsed.images && parsed.images.length > 0 ? parsed.images : (parsed.image ? [parsed.image, ...defaultImages.slice(1)] : defaultImages),
          price: finalPrice,
          compareAtPrice: targetCurrency === 'XOF' ? Math.round(finalPrice * 1.6) : Math.round(finalPrice * 1.6 * 100) / 100,
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
    const rates = { 'EUR_XOF': 655.957, 'XOF_EUR': 1 / 655.957, 'EUR_USD': 1.08, 'USD_EUR': 1 / 1.08, 'USD_XOF': 605.0, 'XOF_USD': 1 / 605.0 };
    const rate = rates[`${currency}_${newCurrency}`] || 1;
    const newPrice = newCurrency === 'XOF' ? Math.round(product.price * rate) : Math.round(product.price * rate * 100) / 100;
    const newCompare = newCurrency === 'XOF' ? Math.round(product.compareAtPrice * rate) : Math.round(product.compareAtPrice * rate * 100) / 100;
    setProduct({...product, price: newPrice, compareAtPrice: newCompare});
    setCurrency(newCurrency);
  };

  const generateSmartBundles = (basePrice, comparePrice) => {
    const safeCompare = comparePrice > basePrice ? comparePrice : basePrice * 2.8;
    return [
      { id: 1, title: "Pack Découverte (1 Unité)", desc: `ÉCONOMISEZ ${Math.round((1 - basePrice / safeCompare) * 100)}%`, price: basePrice, oldPrice: safeCompare, tag: "" },
      { id: 2, title: "2 Achetés = 1 OFFERT", desc: `Vous recevez 3 unités au total !`, price: basePrice * 2, oldPrice: safeCompare * 3, tag: "Le plus populaire" },
      { id: 3, title: "3 Achetés = 2 OFFERTS", desc: `Vous recevez 5 unités au total !`, price: basePrice * 3, oldPrice: safeCompare * 5, tag: "Meilleure vente" }
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
        setPushMessage('Produit synchronisé !');
        setTimeout(() => setPushStatus('idle'), 4000);
      } else {
        setPushStatus('error');
        setPushMessage(data.error || 'Erreur lors de la synchronisation.');
        setTimeout(() => setPushStatus('idle'), 4000);
      }
    } catch (err) {
      setPushStatus('error');
      setPushMessage('Erreur réseau.');
      setTimeout(() => setPushStatus('idle'), 4000);
    }
  };

  // Hide global sidebar/topbar on preview page for full-screen editing
  useEffect(() => {
    document.body.classList.add('preview-fullscreen');
    return () => document.body.classList.remove('preview-fullscreen');
  }, []);

  return (
    <>
      <style>{`
        .preview-fullscreen .page-content { padding: 0 !important; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        .preview-fullscreen header { display: none !important; }
      `}</style>
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden', color: '#fff', fontFamily: 'var(--font-family)' }}>
      
      {/* TOPBAR */}
      <div style={{ height: '64px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#050505' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#000" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>Dropmagic</span>
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
          <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: '500' }}>Éditeur de boutique</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {pushStatus === 'success' && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold' }}>
              <Check size={16} /> {pushMessage}
            </span>
          )}
          {pushStatus === 'error' && (
            <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>{pushMessage}</span>
          )}
          
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            style={{ 
              background: isPreviewMode ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            <Eye size={16} /> {isPreviewMode ? "Afficher l'éditeur" : "Masquer l'éditeur"}
          </button>

          <button 
            onClick={handlePushToShopify} 
            disabled={pushStatus === 'pushing'}
            style={{ 
              background: pushStatus === 'pushing' ? '#059669' : '#10b981', color: '#fff', border: 'none', 
              padding: '10px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: pushStatus === 'pushing' ? 'not-allowed' : 'pointer', 
              fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            {pushStatus === 'pushing' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {pushStatus === 'pushing' ? 'Publication...' : 'Publier sur Shopify'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR (EDITOR CONTROLS) */}
        {!isPreviewMode && (
          <div style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 16px 0 16px', gap: '16px' }}>
              <button 
                onClick={() => setActiveTab('content')}
                style={{ background: 'none', border: 'none', borderBottom: activeTab === 'content' ? '2px solid #fff' : '2px solid transparent', color: activeTab === 'content' ? '#fff' : '#a1a1aa', paddingBottom: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LayoutTemplate size={14} /> Contenu
              </button>
              <button 
                onClick={() => setActiveTab('theme')}
                style={{ background: 'none', border: 'none', borderBottom: activeTab === 'theme' ? '2px solid #fff' : '2px solid transparent', color: activeTab === 'theme' ? '#fff' : '#a1a1aa', paddingBottom: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Palette size={14} /> Thème
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Titre du Produit</label>
                    <textarea 
                      value={product.title}
                      onChange={(e) => setProduct({...product, title: e.target.value})}
                      style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '60px' }}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Prix Actuel</label>
                      <input 
                        type="number" 
                        value={product.price}
                        onChange={(e) => setProduct({...product, price: parseFloat(e.target.value) || 0})}
                        style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Prix Barré</label>
                      <input 
                        type="number" 
                        value={product.compareAtPrice}
                        onChange={(e) => setProduct({...product, compareAtPrice: parseFloat(e.target.value) || 0})}
                        style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Devise</label>
                    <select 
                      value={currency} 
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    >
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dollar US ($)</option>
                      <option value="XOF">Franc CFA (FCFA)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Description Marketing</label>
                    <textarea 
                      value={product.description}
                      onChange={(e) => setProduct({...product, description: e.target.value})}
                      style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '120px' }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Couleur Principale (Texte)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['#000000', '#1f2937', '#4338ca', '#be123c', '#0f766e'].map(c => (
                        <div key={c} onClick={() => setThemeColor(c)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, cursor: 'pointer', border: themeColor === c ? '2px solid #fff' : '2px solid transparent' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Couleur Bouton Ajout Panier</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['#10b981', '#000000', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'].map(c => (
                        <div key={c} onClick={() => setButtonColor(c)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, cursor: 'pointer', border: buttonColor === c ? '2px solid #fff' : '2px solid transparent' }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT AREA (STORE PREVIEW WRAPPER) */}
        <div style={{ flex: 1, background: '#000', padding: isPreviewMode ? '0' : '24px', overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
            <div style={{ 
              width: '100%', maxWidth: isPreviewMode ? '100%' : '1200px', 
              background: '#fff', borderRadius: isPreviewMode ? '0' : '16px', overflow: 'hidden', 
              boxShadow: isPreviewMode ? 'none' : '0 20px 40px rgba(0,0,0,0.4)', border: isPreviewMode ? 'none' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', height: 'max-content', zoom: 0.65
            }}>
            
            {/* INJECTED STORE PREVIEW CONTENT */}
            <div style={{ minHeight: '100%', color: themeColor, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              
              <div style={{ background: themeColor, color: '#fff', textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                Livraison rapide 🚚
              </div>

              <div style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0, color: themeColor }}>Ma Boutique</h1>
                <ShoppingBag size={24} strokeWidth={1.5} color={themeColor} />
              </div>

              <main style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
                
                {/* Image Gallery */}
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #eaeaea' }}>
                    <img src={product.images[0]} alt="Product Main" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '24px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {product.images.slice(1).map((img, idx) => (
                      <div key={idx} style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', border: '1px solid #eaeaea', background: '#f9f9f9', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={img} alt={`Gallery Image ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Tendance Actuelle</p>
                  
                  <h1 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px', color: themeColor }}>
                    {product.title}
                  </h1>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: themeColor }}>
                      {formatPrice(product.price)}
                    </div>
                    <div style={{ fontSize: '20px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>
                      {formatPrice(product.compareAtPrice)}
                    </div>
                    <span style={{ background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '800' }}>
                      Économisez {Math.round((1 - product.price/product.compareAtPrice)*100) || 0}%
                    </span>
                  </div>

                  <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                    {product.description}
                  </p>

                  {/* Bundles */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', color: themeColor }}>Choisissez votre pack</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {smartBundles.map(opt => (
                        <label key={opt.id} onClick={() => setBundle(opt.id)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: bundle === opt.id ? `2px solid ${themeColor}` : '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: bundle === opt.id ? '#f8fafc' : '#fff', transition: 'all 0.2s' }}>
                          {opt.tag && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: themeColor, color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>{opt.tag}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: bundle === opt.id ? `6px solid ${themeColor}` : '2px solid #d1d5db' }}></div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: themeColor }}>{opt.title}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontWeight: '500' }}>{opt.desc}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '800', fontSize: '16px', color: themeColor }}>{formatPrice(opt.price)}</div>
                            <div style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>{formatPrice(opt.oldPrice)}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button style={{ width: '100%', background: buttonColor, color: '#fff', padding: '20px', borderRadius: '12px', fontSize: '18px', fontWeight: '800', border: 'none', cursor: 'pointer', marginBottom: '16px', transition: 'transform 0.1s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: `0 8px 24px ${buttonColor}40` }} onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }} onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <ShoppingBag size={22} /> Ajouter au Panier
                  </button>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', flex: 1 }}>
                      <ShieldCheck size={24} color={themeColor} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: themeColor }}>Paiement Sécurisé</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Cryptage SSL 256-bit</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', flex: 1 }}>
                      <Truck size={24} color={themeColor} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: themeColor }}>Livraison Rapide</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Expédition en 24/48h</div>
                      </div>
                    </div>
                  </div>

                </div>
              </main>

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
