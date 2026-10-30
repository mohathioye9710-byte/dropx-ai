"use client";

import { useEffect, useState } from 'react';
import { ShoppingBag, ShieldCheck, Truck, ArrowLeft, Check, Zap, Loader2, LayoutTemplate, Palette, Image as ImageIcon, Settings, Eye, ChevronLeft, ChevronRight, Calculator, DollarSign, TrendingUp, Sparkles, Package, HelpCircle, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeLandingPage } from '@/lib/landing-page';
import { getDeliveryFeeByZone, getWaveFee, formatFCFA, normalizePriceFCFA } from '@/lib/senegalCod';

const TEXT_THEME_COLORS = ['#000000', '#ffffff', '#64748b', '#6b7280', '#7c6a9f', '#a56d7b', '#6f8c82', '#8b7b68', '#7d8e59', '#5e7894'];
const BUTTON_THEME_COLORS = ['#000000', '#ffffff', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#fed7aa', '#fde68a', '#bae6fd', '#c7d2fe', '#bbf7d0'];

export default function StoreBuilder() {
  const router = useRouter();
  
  const defaultImages = [
    'https://images.unsplash.com/photo-1583947581924-860bda6a5e0e?w=800&q=80',
    'https://images.unsplash.com/photo-1528313437190-302a90da30d5?w=800&q=80',
    'https://images.unsplash.com/photo-1626226190740-410ce4416bbd?w=800&q=80',
    'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=800&q=80'
  ];

  const [product, setProduct] = useState({
    title: 'Tapis de Massage Électrique : Soulagement Instantané du Stress!',
    description: "Découvrez notre produit révolutionnaire. Un design parfait, une utilité prouvée, testé et approuvé par des milliers de clients satisfaits.",
    images: defaultImages,
    price: 13500,
    compareAtPrice: 20000
  });

  const [bundle, setBundle] = useState(1);
  const [currency, setCurrency] = useState('XOF'); // Default XOF for Senegal
  const [merchantPhone, setMerchantPhone] = useState('+221775447866');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('Dakar Centre (Plateau, Médina, Fann, Point E)');
  const [formAddress, setFormAddress] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Espèces à la livraison');
  const [isFreeShipping, setIsFreeShipping] = useState(true); // Livraison gratuite par défaut
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null);
  
  // Builder state
  const [activeTab, setActiveTab] = useState('content'); // content, calc, theme
  const [themeColor, setThemeColor] = useState('#000000');
  const [buttonColor, setButtonColor] = useState('#10b981');
  const [pushStatus, setPushStatus] = useState('idle');
  const [pushMessage, setPushMessage] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Simulateur de Prix & Marge (Sénégal COD & Import Chine)
  const [stockQty, setStockQty] = useState(20); // user: stock de 20 max
  const [supplierUnitCost, setSupplierUnitCost] = useState(616); // prix d'achat usine Alibaba
  const [forwarderUnitCost, setForwarderUnitCost] = useState(1800); // transitaire GP Chine ➔ Dakar (~200g à 8500-9000 F/kg)
  const [localDeliveryCost, setLocalDeliveryCost] = useState(2000); // livreur Dakar
  const [adCostPerOrder, setAdCostPerOrder] = useState(2000); // coût pub Meta Ads estimé par vente
  const [waveFeePerOrder, setWaveFeePerOrder] = useState(150); // frais encaissement Wave
  const [sellingPriceInput, setSellingPriceInput] = useState(13500);
  const [calcSuccessMsg, setCalcSuccessMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('dropx_preview_product');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let originalCurrency = 'XOF';
        if (parsed.price) {
          const upperP = String(parsed.price).toUpperCase();
          if (upperP.includes('EUR') || upperP.includes('€')) originalCurrency = 'EUR';
          else if (upperP.includes('USD') || upperP.includes('$')) originalCurrency = 'USD';
          else originalCurrency = 'XOF';
        }

        const parseRobust = (p) => {
          if (!p) return 13500;
          let s = String(p).replace(/[^0-9.,]/g, '');
          if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
          else if (s.includes(',')) {
            const pts = s.split(',');
            s = pts[pts.length-1].length === 3 ? s.replace(/,/g, '') : s.replace(/,/g, '.');
          }
          return parseFloat(s) || 13500;
        };
        const basePriceOrig = parseRobust(parsed.price);
        
        let targetCurrency = 'XOF'; // Always Franc CFA by default
        let finalPrice = 13500;
        let comparePrice = 20000;

        // Détection du prix réel usine Alibaba (616 FCFA)
        if (parsed.supplierCost) {
          setSupplierUnitCost(parseRobust(parsed.supplierCost));
        } else if (basePriceOrig === 616 || basePriceOrig < 1000) {
          setSupplierUnitCost(Math.round(basePriceOrig));
        } else {
          setSupplierUnitCost(616); // Prix réel usine Alibaba extrait (1-498 pièces : 616 FCFA)
        }

        if (originalCurrency === 'XOF' && basePriceOrig < 3000) {
          finalPrice = 13500;
          comparePrice = 20000;
        } else if (originalCurrency === 'XOF') {
          finalPrice = Math.round(basePriceOrig);
          comparePrice = parsed.compareAtPrice ? parseRobust(parsed.compareAtPrice) : Math.round(finalPrice * 1.5);
        } else if (originalCurrency === 'USD') {
          finalPrice = 13500;
          comparePrice = 20000;
        }

        setSellingPriceInput(finalPrice);
        setCurrency(targetCurrency);
        setProduct({
          ...product,
          title: parsed.title || product.title,
          description: parsed.description || product.description,
          images: parsed.images && parsed.images.length > 0 ? parsed.images : (parsed.image ? [parsed.image, ...defaultImages.slice(1)] : defaultImages),
          price: finalPrice,
          compareAtPrice: comparePrice,
          landingPage: parsed.landingPage || {},
        });
      } catch (e) {}
    }
  }, []);

  const formatPrice = (price) => {
    if (currency === 'XOF') {
      const rounded = Math.round(price || 0);
      return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(price || 0);
  };

  const handleCurrencyChange = (newCurrency) => {
    if (currency === newCurrency) return;
    const rates = { 'EUR_XOF': 655.957, 'XOF_EUR': 1 / 655.957, 'EUR_USD': 1.08, 'USD_EUR': 1 / 1.08, 'USD_XOF': 605.0, 'XOF_USD': 1 / 605.0 };
    const rate = rates[`${currency}_${newCurrency}`] || 1;
    
    let newPrice = product.price * rate;
    let newCompare = product.compareAtPrice * rate;

    if (newCurrency === 'XOF') {
      newPrice = Math.ceil(newPrice / 100) * 100;
      newCompare = Math.ceil(newCompare / 100) * 100;
    } else {
      newPrice = Math.floor(newPrice) + 0.99;
      newCompare = Math.floor(newCompare) + 0.99;
    }

    setProduct({...product, price: newPrice, compareAtPrice: newCompare});
    setCurrency(newCurrency);
  };

  // Calculs Simulateur Prix & Marge
  const totalUnitCost = Number(supplierUnitCost || 0) + Number(forwarderUnitCost || 0) + Number(localDeliveryCost || 0) + Number(adCostPerOrder || 0) + Number(waveFeePerOrder || 0);
  const netProfitPerUnit = Number(sellingPriceInput || 0) - totalUnitCost;
  const marginPct = sellingPriceInput > 0 ? Math.round((netProfitPerUnit / sellingPriceInput) * 100) : 0;
  
  const totalRevenue = Number(stockQty || 0) * Number(sellingPriceInput || 0);
  const totalStockInvestment = Number(stockQty || 0) * (Number(supplierUnitCost || 0) + Number(forwarderUnitCost || 0));
  const totalAdSpend = Number(stockQty || 0) * Number(adCostPerOrder || 0);
  const totalDeliveryFees = Number(stockQty || 0) * Number(localDeliveryCost || 0);
  const totalWaveFees = Number(stockQty || 0) * Number(waveFeePerOrder || 0);
  const totalNetProfit = Number(stockQty || 0) * netProfitPerUnit;

  const handleApplyCalculatedPrice = (customPrice) => {
    const finalPrice = Math.round(Number(customPrice || sellingPriceInput) || 13500);
    const comparePrice = Math.ceil((finalPrice * 1.5) / 1000) * 1000;
    
    setProduct(prev => ({
      ...prev,
      price: finalPrice,
      compareAtPrice: comparePrice
    }));
    setCurrency('XOF');

    try {
      const saved = localStorage.getItem('dropx_preview_product');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.price = `${finalPrice} FCFA`;
        parsed.compareAtPrice = `${comparePrice} FCFA`;
        localStorage.setItem('dropx_preview_product', JSON.stringify(parsed));
      }
    } catch (e) {}

    setCalcSuccessMsg(`Prix de ${finalPrice.toLocaleString('fr-FR')} FCFA appliqué avec succès !`);
    setTimeout(() => setCalcSuccessMsg(''), 4000);
  };

  const generateSmartBundles = (basePrice, comparePrice, currentCurrency) => {
    const roundPrice = (p) => {
      if (currentCurrency === 'XOF') return Math.ceil(p / 100) * 100;
      return Math.floor(p) + 0.99;
    };
    
    const safeCompare = comparePrice > basePrice ? comparePrice : basePrice * 2.8;
    
    // Algorithme de maximisation des bénéfices
    // Pack 2: -15% de réduction
    const b2Price = roundPrice(basePrice * 2 * 0.85);
    const b2Compare = roundPrice(safeCompare * 2);
    
    // Pack 3: -25% de réduction
    const b3Price = roundPrice(basePrice * 3 * 0.75);
    const b3Compare = roundPrice(safeCompare * 3);

    return [
      { id: 1, title: "1 Unité", desc: `Idéal pour tester`, price: basePrice, oldPrice: safeCompare, tag: "" },
      { id: 2, title: "2 Achetés (-15%)", desc: `ÉCONOMISEZ 15% IMMÉDIATEMENT`, price: b2Price, oldPrice: b2Compare, tag: "Le plus populaire" },
      { id: 3, title: "3 Achetés (-25%)", desc: `MEILLEURE OFFRE - ÉCONOMISEZ 25%`, price: b3Price, oldPrice: b3Compare, tag: "Meilleure vente" }
    ];
  };

  const smartBundles = generateSmartBundles(product.price, product.compareAtPrice, currency);
  const landingPage = normalizeLandingPage(product.landingPage, product.title);
  const themeForeground = themeColor.toLowerCase() === '#ffffff' ? '#111111' : '#ffffff';
  const buttonForeground = buttonColor.toLowerCase() === '#000000' ? '#ffffff' : '#111111';

  const handleTestCODOrder = async () => {
    if (!formName.trim()) {
      alert("Veuillez saisir votre prénom et nom.");
      return;
    }
    if (!formPhone.trim()) {
      alert("Veuillez saisir votre numéro de téléphone.");
      return;
    }
    if (!formAddress.trim()) {
      alert("Veuillez préciser votre quartier ou adresse de livraison.");
      return;
    }

    setIsSubmittingOrder(true);
    const selectedBundleObj = smartBundles.find(b => b.id === bundle) || smartBundles[0];
    const rawProductPrice = normalizePriceFCFA(selectedBundleObj.price, currency);
    const baseZoneFee = getDeliveryFeeByZone(formCity);
    const effectiveDeliveryFee = isFreeShipping ? 0 : baseZoneFee;
    const totalAmount = rawProductPrice + effectiveDeliveryFee;
    const waveFee = getWaveFee(totalAmount);
    const fullPhone = '+221 ' + formPhone.replace(/^\+221/, '').trim();

    try {
      const res = await fetch('/api/orders/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formName,
          customerPhone: fullPhone,
          customerCity: formCity,
          customerAddress: formAddress,
          paymentMethod: formPaymentMethod,
          productTitle: product.title,
          bundleTitle: selectedBundleObj.title,
          quantity: bundle,
          unitPrice: rawProductPrice,
          deliveryFee: effectiveDeliveryFee,
          totalPrice: totalAmount,
          currency: 'XOF',
          merchantPhone: merchantPhone
        })
      });
      const data = await res.json();
      setOrderModalData({
        productTitle: `${product.title} (${selectedBundleObj.title})`,
        totalPrice: formatFCFA(totalAmount),
        deliveryFee: isFreeShipping ? '0 FCFA (Livraison Gratuite)' : formatFCFA(baseZoneFee),
        address: `${formAddress}, ${formCity}`,
        paymentMethod: formPaymentMethod,
        whatsappUrl: data.whatsappUrl || `https://wa.me/${merchantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ShopX ! Je confirme ma commande : ${product.title} (${selectedBundleObj.title}) pour ${formatFCFA(totalAmount)} avec LIVRAISON GRATUITE à ${formAddress}, ${formCity}.`)}`
      });
    } catch (e) {
      setOrderModalData({
        productTitle: `${product.title} (${selectedBundleObj.title})`,
        totalPrice: formatFCFA(totalAmount),
        deliveryFee: isFreeShipping ? '0 FCFA (Livraison Gratuite)' : formatFCFA(baseZoneFee),
        address: `${formAddress}, ${formCity}`,
        paymentMethod: formPaymentMethod,
        whatsappUrl: `https://wa.me/${merchantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ! Je confirme ma commande : ${product.title} (${selectedBundleObj.title}) pour ${formatFCFA(totalAmount)} avec LIVRAISON GRATUITE à ${formAddress}, ${formCity}.`)}`
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePushToShopify = async () => {
    setPushStatus('pushing');
    setPushMessage('');
    try {
      const res = await fetch('/api/shopify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, currency, themeColor, buttonColor })
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
    <div>
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
          <div style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
            
            {/* Collapse button */}
            <button 
              onClick={() => setIsPreviewMode(true)}
              style={{
                position: 'absolute', top: '20px', right: '-12px', width: '24px', height: '24px', 
                background: '#fff', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', border: '1px solid #e5e7eb', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
              title="Replier l'éditeur"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 12px 0 12px', gap: '8px' }}>
              <button 
                onClick={() => setActiveTab('content')}
                style={{ background: 'none', border: 'none', borderBottom: activeTab === 'content' ? '2px solid #fff' : '2px solid transparent', color: activeTab === 'content' ? '#fff' : '#a1a1aa', paddingBottom: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LayoutTemplate size={14} /> Contenu
              </button>
              <button 
                onClick={() => setActiveTab('calc')}
                style={{ background: 'none', border: 'none', borderBottom: activeTab === 'calc' ? '2px solid #10b981' : '2px solid transparent', color: activeTab === 'calc' ? '#10b981' : '#a1a1aa', paddingBottom: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Calculator size={14} /> Simulateur Prix
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
                  
                  {/* Quick Shortcut to Calculator */}
                  <div 
                    onClick={() => setActiveTab('calc')}
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)', 
                      border: '1.5px solid #10b981', 
                      borderRadius: '12px', 
                      padding: '14px', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calculator size={16} /> Simulateur Prix & Marge
                      </span>
                      <span style={{ fontSize: '10px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>SÉNÉGAL</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                      Calcule automatiquement le transitaire, la pub Meta Ads, la livraison et ta marge nette sur ton stock de {stockQty} pièces.
                    </p>
                  </div>

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
                      <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Prix Actuel ({currency})</label>
                      <input 
                        type="number" 
                        value={product.price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setProduct({...product, price: val});
                          setSellingPriceInput(val);
                        }}
                        style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Prix Barré ({currency})</label>
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
                      <option value="XOF">Franc CFA (FCFA) - Recommandé Sénégal</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dollar US ($)</option>
                    </select>
                  </div>

                  {/* TOGGLE LIVRAISON GRATUITE */}
                  <div style={{ background: '#18181b', border: isFreeShipping ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={16} color={isFreeShipping ? '#10b981' : '#94a3b8'} /> Livraison Gratuite (Offerte)
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {isFreeShipping ? '0 FCFA affiché au client (Booste les ventes x3)' : 'Frais de livraison facturés en plus au client'}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsFreeShipping(!isFreeShipping)}
                      style={{
                        background: isFreeShipping ? '#10b981' : '#334155',
                        color: isFreeShipping ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      {isFreeShipping ? 'GRATUIT ✅' : 'PAYANT'}
                    </button>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#10b981', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Numéro WhatsApp Vendeur (Sénégal)</label>
                    <input 
                      type="text" 
                      value={merchantPhone}
                      onChange={(e) => setMerchantPhone(e.target.value)}
                      placeholder="+221 77 000 00 00"
                      style={{ width: '100%', background: '#111', border: '1px solid #10b981', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '6px' }}
                    />
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Vos clients vous confirmeront leur commande sur ce numéro.</span>
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

              {/* SIMULATEUR DE PRIX & MARGE (SÉNÉGAL / AFRIQUE COD) */}
              {activeTab === 'calc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {calcSuccessMsg && (
                    <div style={{ background: '#064e3b', border: '1px solid #10b981', color: '#a7f3d0', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={16} color="#10b981" /> {calcSuccessMsg}
                    </div>
                  )}

                  <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Package size={18} color="#10b981" />
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Paramètres de ton stock & coûts</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>📦 Stock prévu à commander</label>
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '800' }}>{stockQty} unités</span>
                        </div>
                        <input 
                          type="number" 
                          value={stockQty} 
                          min="1" 
                          max="1000"
                          onChange={(e) => setStockQty(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>🏭 Prix d'achat usine (Alibaba)</label>
                          <button 
                            type="button" 
                            onClick={() => setSupplierUnitCost(616)}
                            style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                            title="Remettre le prix réel Alibaba (616 FCFA)"
                          >
                            616 FCFA (Alibaba) ✓
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            value={supplierUnitCost} 
                            onChange={(e) => setSupplierUnitCost(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 12px', paddingRight: '55px', borderRadius: '8px', fontSize: '14px', fontWeight: '700' }}
                          />
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>FCFA</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                          ✓ Prix vérifié sur Alibaba : 616 F CFA (1 à 498 pièces)
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>✈️ Fret Aérien GP (Chine ➔ Dakar)</label>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>~210g / unité</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            value={forwarderUnitCost} 
                            onChange={(e) => setForwarderUnitCost(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 12px', paddingRight: '55px', borderRadius: '8px', fontSize: '14px' }}
                          />
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>FCFA</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>🚚 Livraison locale client (Dakar)</label>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>par commande</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            value={localDeliveryCost} 
                            onChange={(e) => setLocalDeliveryCost(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 12px', paddingRight: '55px', borderRadius: '8px', fontSize: '14px' }}
                          />
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>FCFA</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>📢 Budget Meta Ads estimé / vente</label>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>CPA cible</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            value={adCostPerOrder} 
                            onChange={(e) => setAdCostPerOrder(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 12px', paddingRight: '55px', borderRadius: '8px', fontSize: '14px' }}
                          />
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>FCFA</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>📱 Frais Wave / Encaissement COD</label>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>1%</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            value={waveFeePerOrder} 
                            onChange={(e) => setWaveFeePerOrder(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 12px', paddingRight: '55px', borderRadius: '8px', fontSize: '14px' }}
                          />
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COÛT DE REVIENT TOTAL & MARGE */}
                  <div style={{ background: '#1e293b', border: '1.5px solid #3b82f6', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                      ⚡ Analyse de rentabilité unitaire
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#cbd5e1' }}>Coût total de revient / vente :</span>
                      <span style={{ fontWeight: '800', color: '#f87171' }}>{totalUnitCost.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                      <span style={{ color: '#cbd5e1' }}>Marge nette par produit vendu :</span>
                      <span style={{ fontWeight: '800', color: '#4ade80' }}>+{netProfitPerUnit.toLocaleString('fr-FR')} FCFA ({marginPct}%)</span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#fff', fontWeight: '800', marginBottom: '6px' }}>
                        🎯 Prix de vente conseillé (1 Unité)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="number" 
                          value={sellingPriceInput}
                          step="500"
                          onChange={(e) => setSellingPriceInput(parseFloat(e.target.value) || 0)}
                          style={{ flex: 1, background: '#0f172a', border: '2px solid #10b981', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: '800' }}
                        />
                        <button 
                          onClick={() => setSellingPriceInput(13500)}
                          style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          title="Réinitialiser à 13 500 FCFA"
                        >
                          13.5k
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BILAN SUR LE STOCK COMPLET */}
                  <div style={{ background: '#052e16', border: '1.5px solid #10b981', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={16} color="#10b981" /> Bilan sur ton stock de {stockQty} pièces
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dcfce7' }}>
                        <span>💰 Chiffre d'Affaires total généré :</span>
                        <b>{totalRevenue.toLocaleString('fr-FR')} FCFA</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                        <span>📦 Achat Stock + Transitaire Chine :</span>
                        <b>- {totalStockInvestment.toLocaleString('fr-FR')} FCFA</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                        <span>📢 Dépenses Publicité Meta Ads :</span>
                        <b>- {totalAdSpend.toLocaleString('fr-FR')} FCFA</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                        <span>🚚 Frais Livreurs Dakar :</span>
                        <b>- {totalDeliveryFees.toLocaleString('fr-FR')} FCFA</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                        <span>📱 Frais Wave (1%) :</span>
                        <b>- {totalWaveFees.toLocaleString('fr-FR')} FCFA</b>
                      </div>

                      <div style={{ borderTop: '1px dashed #10b981', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: '900' }}>💵 BÉNÉFICE NET EN POCHE :</span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80' }}>
                          +{totalNetProfit.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON TO APPLY TO STORE */}
                  <button 
                    onClick={() => handleApplyCalculatedPrice(sellingPriceInput)}
                    style={{ 
                      width: '100%', 
                      background: '#10b981', 
                      color: '#000', 
                      padding: '16px', 
                      borderRadius: '12px', 
                      fontSize: '15px', 
                      fontWeight: '900', 
                      border: 'none', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Zap size={18} /> Appliquer ce prix ({sellingPriceInput.toLocaleString('fr-FR')} FCFA)
                  </button>

                </div>
              )}

              {activeTab === 'theme' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Couleur Principale (Texte)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TEXT_THEME_COLORS.map(c => (
                        <div key={c} onClick={() => setThemeColor(c)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, cursor: 'pointer', border: themeColor === c ? '2px solid #fff' : '2px solid transparent' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Couleur Bouton Ajout Panier</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {BUTTON_THEME_COLORS.map(c => (
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
        <div style={{ flex: 1, background: '#000', padding: isPreviewMode ? '0' : '24px', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          
          {isPreviewMode && (
            <button 
              onClick={() => setIsPreviewMode(false)}
              style={{
                position: 'absolute', top: '20px', left: '20px', width: '36px', height: '36px', 
                background: '#fff', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', border: '1px solid #e5e7eb', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              title="Ouvrir l'éditeur"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
            <div style={{ 
              width: '100%', maxWidth: isPreviewMode ? '100%' : '1200px', 
              background: '#fff', borderRadius: isPreviewMode ? '0' : '16px', overflow: 'hidden', 
              boxShadow: isPreviewMode ? 'none' : '0 20px 40px rgba(0,0,0,0.4)', border: isPreviewMode ? 'none' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', height: 'max-content', zoom: 0.65
            }}>
            
            {/* INJECTED STORE PREVIEW CONTENT */}
            <div style={{ minHeight: '100%', color: themeColor, fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }}>
              
              <div style={{ background: themeColor, color: themeForeground, textAlign: 'center', padding: '9px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>
                {isFreeShipping ? '🎉 LIVRAISON GRATUITE PARTOUT AU SÉNÉGAL 🚚🎁 (PAIEMENT À LA LIVRAISON)' : 'Livraison rapide 🚚'}
              </div>

              <div style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <Link href="/stores" style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0, color: themeColor, textDecoration: 'none', cursor: 'pointer' }}>ShopX</Link>
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
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

                  {isFreeShipping && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1.5px solid #10b981', color: '#065f46', padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', marginBottom: '20px', width: 'fit-content' }}>
                      <span>🎁</span> LIVRAISON GRATUITE AU SÉNÉGAL (Dakar & Régions en 24h/48h)
                    </div>
                  )}

                  <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                    {product.description}
                  </p>

                  {/* Bundles */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', color: themeColor }}>Choisissez votre pack</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {smartBundles.map(opt => (
                        <label key={opt.id} onClick={() => setBundle(opt.id)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: bundle === opt.id ? `2px solid ${themeColor}` : '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: bundle === opt.id ? '#f8fafc' : '#fff', transition: 'all 0.2s' }}>
                          {opt.tag && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: themeColor, color: themeForeground, fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>{opt.tag}</div>}
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

                  {/* FORMULAIRE EASYSELL SÉNÉGAL (COD 1-CLIC) */}
                  <div style={{ background: '#fff', border: `2px solid ${buttonColor}`, borderRadius: '16px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginTop: '20px' }}>
                    
                    <div style={{ background: buttonColor, color: buttonForeground, padding: '10px 14px', borderRadius: '10px', textAlign: 'center', fontWeight: '800', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span>⚡</span> COMMANDE RAPIDE EN 1 CLIC (PAIEMENT À LA LIVRAISON)
                    </div>

                    <p style={{ fontSize: '13px', color: '#4b5563', textAlign: 'center', margin: '0 0 18px', lineHeight: '1.4' }}>
                      Pas besoin de carte bancaire ! Remplissez vos coordonnées, nous vous livrons chez vous et vous réglez à la réception.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                          👤 Votre Prénom et Nom <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          value={formName} 
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ex: Mamadou Diallo" 
                          style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1.5px solid #d1d5db', borderRadius: '10px', fontSize: '15px', color: '#111', background: '#f9fafb', outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                          📞 Numéro WhatsApp / Téléphone <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#e5e7eb', borderRadius: '10px', fontWeight: '700', fontSize: '14px', color: '#374151' }}>🇸🇳 +221</span>
                          <input 
                            type="tel" 
                            value={formPhone} 
                            onChange={(e) => setFormPhone(e.target.value)}
                            placeholder="77 123 45 67" 
                            style={{ flex: 1, boxSizing: 'border-box', padding: '13px 14px', border: '1.5px solid #d1d5db', borderRadius: '10px', fontSize: '15px', color: '#111', background: '#f9fafb', outline: 'none' }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>Notre livreur vous appellera sur ce numéro avant de passer.</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                          📍 Ville / Région <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select 
                          value={formCity} 
                          onChange={(e) => setFormCity(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1.5px solid #d1d5db', borderRadius: '10px', fontSize: '15px', color: '#111', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="Dakar Centre (Plateau, Médina, Fann, Point E)">Dakar Centre (Plateau, Médina, Fann, Point E)</option>
                          <option value="Dakar Ouest (Almadies, Ngor, Ouakam, Mermoz)">Dakar Ouest (Almadies, Ngor, Ouakam, Mermoz)</option>
                          <option value="Dakar Nord (Yoff, Ouest-Foire, Nord-Foire, Maristes)">Dakar Nord (Yoff, Ouest-Foire, Nord-Foire, Maristes)</option>
                          <option value="Dakar Banlieue (Pikine, Guédiawaye, Parcelles Assainies)">Dakar Banlieue (Pikine, Guédiawaye, Parcelles Assainies)</option>
                          <option value="Rufisque / Keur Massar / Diamniadio">Rufisque / Keur Massar / Diamniadio</option>
                          <option value="Thiès / Mbour / Saly">Thiès / Mbour / Saly</option>
                          <option value="Touba / Mbacké / Diourbel">Touba / Mbacké / Diourbel</option>
                          <option value="Saint-Louis">Saint-Louis</option>
                          <option value="Kaolack">Kaolack</option>
                          <option value="Ziguinchor">Ziguinchor</option>
                          <option value="Autre région du Sénégal">Autre région du Sénégal</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                          🏠 Quartier / Adresse de livraison <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          value={formAddress} 
                          onChange={(e) => setFormAddress(e.target.value)}
                          placeholder="Ex: Sacré-Cœur 3, près de la boulangerie..." 
                          style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1.5px solid #d1d5db', borderRadius: '10px', fontSize: '15px', color: '#111', background: '#f9fafb', outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                          💵 Mode de Paiement à la réception
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <label 
                            onClick={() => setFormPaymentMethod('Espèces à la livraison')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: formPaymentMethod === 'Espèces à la livraison' ? '2px solid #10b981' : '1.5px solid #e5e7eb', borderRadius: '10px', background: formPaymentMethod === 'Espèces à la livraison' ? '#f0fdf4' : '#f9fafb', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: formPaymentMethod === 'Espèces à la livraison' ? '#15803d' : '#374151', transition: 'all 0.2s' }}
                          >
                            <input type="radio" checked={formPaymentMethod === 'Espèces à la livraison'} onChange={() => {}} style={{ accentColor: '#10b981' }} />
                            <span>💵 Espèces</span>
                          </label>
                          <label 
                            onClick={() => setFormPaymentMethod('Wave / Orange Money')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: formPaymentMethod === 'Wave / Orange Money' ? '2px solid #1d4ed8' : '1.5px solid #e5e7eb', borderRadius: '10px', background: formPaymentMethod === 'Wave / Orange Money' ? '#eff6ff' : '#f9fafb', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: formPaymentMethod === 'Wave / Orange Money' ? '#1e40af' : '#374151', transition: 'all 0.2s' }}
                          >
                            <input type="radio" checked={formPaymentMethod === 'Wave / Orange Money'} onChange={() => {}} style={{ accentColor: '#1d4ed8' }} />
                            <span>📱 Wave / OM</span>
                          </label>
                        </div>
                      </div>

                      {/* Summary with Zone Delivery Fee and Wave 1% */}
                      {(() => {
                        const selectedBundleObj = smartBundles.find(b => b.id === bundle) || smartBundles[0];
                        const rawProductPrice = normalizePriceFCFA(selectedBundleObj.price, currency);
                        const baseZoneFee = getDeliveryFeeByZone(formCity);
                        const deliveryFee = isFreeShipping ? 0 : baseZoneFee;
                        const totalAmount = rawProductPrice + deliveryFee;
                        const waveFee = getWaveFee(totalAmount);

                        return (
                          <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '14px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#4b5563' }}>
                              <span>Sous-total ({selectedBundleObj.title}) :</span>
                              <span style={{ fontWeight: '700', color: '#111' }}>{formatFCFA(rawProductPrice)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#4b5563' }}>
                              <span>Frais de livraison ({formCity.split('(')[0].trim()}) :</span>
                              {isFreeShipping ? (
                                <span style={{ fontWeight: '800', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <s style={{ color: '#9ca3af', fontWeight: 'normal' }}>{formatFCFA(baseZoneFee)}</s>
                                  <span>GRATUITE (0 FCFA) 🎉</span>
                                </span>
                              ) : (
                                <span style={{ fontWeight: '700', color: '#10b981' }}>+ {formatFCFA(deliveryFee)}</span>
                              )}
                            </div>
                            {formPaymentMethod === 'Wave / Orange Money' && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#1d4ed8', background: '#eff6ff', padding: '6px 10px', borderRadius: '6px' }}>
                                <span>📱 Paiement Wave direct :</span>
                                <span style={{ fontWeight: '700' }}>1% sécurisé ({formatFCFA(waveFee)})</span>
                              </div>
                            )}
                            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '13px', color: '#111', fontWeight: '800' }}>TOTAL À RÉGLER À LA LIVRAISON :</div>
                              <div style={{ fontSize: '22px', fontWeight: '900', color: buttonColor }}>
                                {formatFCFA(totalAmount)}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* CTA Button */}
                      <button 
                        type="button" 
                        onClick={handleTestCODOrder}
                        disabled={isSubmittingOrder}
                        style={{ width: '100%', background: buttonColor, color: buttonForeground, padding: '18px 20px', borderRadius: '12px', fontSize: '17px', fontWeight: '900', border: 'none', cursor: isSubmittingOrder ? 'not-allowed' : 'pointer', transition: 'transform 0.1s, box-shadow 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: `0 8px 22px ${buttonColor}50` }}
                      >
                        {isSubmittingOrder ? "Traitement de la commande..." : (isFreeShipping ? `COMMANDER (${formatFCFA(normalizePriceFCFA((smartBundles.find(b => b.id === bundle) || smartBundles[0]).price, currency))} - LIVRAISON GRATUITE) 🚚` : "COMMANDER MAINTENANT (PAIEMENT À LA LIVRAISON) 🚚")}
                      </button>

                      {/* Senegal Trust Highlights */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', fontSize: '11px', color: '#4b5563' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>📦</span> <b>Vérifiez avant de payer</b></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>🚚</span> <b>{isFreeShipping ? "Livraison Gratuite 24h/48h" : "Livraison 24h/48h Sénégal"}</b></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>📞</span> <b>Confirmation WhatsApp</b></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>🔒</span> <b>Paiement 100% sécurisé</b></div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Modal in Preview */}
                  {orderModalData && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}>
                      <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', color: '#111' }}>
                        <div style={{ width: '70px', height: '70px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 16px' }}>
                          ✓
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111', margin: '0 0 8px' }}>Félicitations ! 🎉</h2>
                        <p style={{ fontSize: '15px', color: '#4b5563', margin: '0 0 16px', lineHeight: '1.5' }}>
                          Votre commande a été enregistrée avec succès. Notre équipe va vous appeler pour organiser la livraison.
                        </p>

                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', textAlign: 'left', fontSize: '13px', color: '#374151', marginBottom: '20px' }}>
                          <div style={{ marginBottom: '6px' }}><b>📦 Produit :</b> {orderModalData.productTitle}</div>
                          <div style={{ marginBottom: '6px' }}><b>💰 Montant :</b> <span style={{ fontWeight: '800', color: '#10b981' }}>{orderModalData.totalPrice}</span></div>
                          <div style={{ marginBottom: '6px' }}><b>📍 Livraison :</b> {orderModalData.address}</div>
                          <div><b>💵 Règlement :</b> {orderModalData.paymentMethod}</div>
                        </div>

                        <a 
                          href={orderModalData.whatsappUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#25D366', color: '#fff', padding: '16px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', textDecoration: 'none', boxShadow: '0 8px 20px rgba(37,211,102,0.4)' }}
                        >
                          <span style={{ fontSize: '20px' }}>💬</span> Confirmer rapidement sur WhatsApp
                        </a>

                        <button 
                          type="button" 
                          onClick={() => setOrderModalData(null)} 
                          style={{ marginTop: '14px', background: 'transparent', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Fermer cette fenêtre
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </main>

              {/* SECTION 1: BENEFITS */}
              {landingPage.section1_benefits && (
                <div style={{ padding: '60px 20px', background: '#fdf2f8', textAlign: 'center' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#c85a7c', marginBottom: '40px' }}>{landingPage.section1_benefits.sectionTitle}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
                      {landingPage.section1_benefits.items.map((item, i) => (
                        <div key={i} style={{ flex: '1 1 30%', minWidth: '250px', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', marginBottom: '12px' }}>{item.title}</h3>
                          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: FEATURES GRID */}
              {landingPage.section2_features && (
                <div style={{ padding: '60px 20px', background: '#fff' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px' }}>
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                      {product.images[1] && <img src={product.images[1]} alt="Feature" style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />}
                    </div>
                    <div style={{ flex: '1 1 45%', minWidth: '300px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {landingPage.section2_features.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                            {item.icon}
                          </div>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: 0 }}>{item.title}</h3>
                          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', margin: 0 }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: STEPS */}
              {landingPage.section3_steps && (
                <div style={{ padding: '60px 20px', background: '#f9f9f9', textAlign: 'center' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '40px' }}>{landingPage.section3_steps.sectionTitle}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
                      {landingPage.section3_steps.items.map((item, i) => (
                        <div key={i} style={{ flex: '1 1 30%', minWidth: '250px' }}>
                          <div style={{ width: '100%', aspectRatio: '1/1', background: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eaeaea' }}>
                            {product.images[i + 2] ? <img src={product.images[i + 2]} alt={`Step ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ fontSize: '48px', fontWeight: '900', color: '#fce7f3' }}>{i + 1}</div>}
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>{item.title}</h3>
                          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: CTA */}
              {landingPage.section4_cta && (
                <div style={{ padding: '60px 20px', background: '#111', color: '#fff', textAlign: 'center' }}>
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '16px', lineHeight: '1.2' }}>{landingPage.section4_cta.title}</h2>
                    <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '30px' }}>{landingPage.section4_cta.text}</p>
                    <button style={{ background: buttonColor, color: buttonForeground, border: 'none', padding: '16px 32px', fontWeight: '700', fontSize: '16px', borderRadius: '8px', cursor: 'pointer' }}>{landingPage.section4_cta.buttonText}</button>
                  </div>
                </div>
              )}

              {/* SECTION 5: POWER / SPECS */}
              {landingPage.section5_power && (
                <div style={{ padding: '60px 20px', background: '#fff' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px' }}>
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                      <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '30px' }}>{landingPage.section5_power.sectionTitle}</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
                        {landingPage.section5_power.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px', border: '1px solid #eaeaea', borderRadius: '8px', background: '#fafafa' }}>
                            <div style={{ fontSize: '24px', minWidth: '30px' }}>{item.icon}</div>
                            <div>
                              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px', color: '#111' }}>{item.title}</h3>
                              <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', margin: 0 }}>{item.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button style={{ display: 'block', width: '100%', textAlign: 'center', background: buttonColor, color: buttonForeground, padding: '16px 32px', fontWeight: '700', fontSize: '16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>{landingPage.section5_power.buttonText}</button>
                      <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '10px', fontWeight: '600' }}>⭐ {landingPage.section5_power.ratingText}</p>
                    </div>
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                      {product.images[0] && <img src={product.images[0]} alt="Power Spec" style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />}
                    </div>
                  </div>
                </div>
              )}

              {/* REVIEWS */}
              {product.landingPage?.reviews && product.landingPage.reviews.length > 0 && (
                <div style={{ background: '#eaf8f9', padding: '60px 20px' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <p style={{ textAlign: 'center', color: '#16a34a', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>⭐⭐⭐⭐⭐ 4.9/5 sur +2500 clients</p>
                    <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', color: '#111', marginBottom: '40px' }}>Ils l&apos;adorent</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                      {product.landingPage.reviews.map((r, i) => (
                        <div key={i} style={{ flex: '1 1 30%', minWidth: '280px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <strong style={{ fontSize: '16px', color: '#111' }}>{r.name}</strong>
                            <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '600' }}>&#10003; Acheteur vérifié</span>
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: '16px', marginBottom: '12px' }}>{'⭐'.repeat(r.rating || 5)}</div>
                          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#444', lineHeight: '1.6' }}>{r.text}</p>
                          <span style={{ fontSize: '12px', color: '#999' }}>Avis récent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {landingPage.reviews.length === 0 && (
                <div style={{ background: '#eaf8f9', padding: '60px 20px' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ color: '#16a34a', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>AVIS CLIENTS</p>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111', marginBottom: '20px' }}>Ils partagent leur expérience</h2>
                    <p style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', background: '#fff', color: '#555', borderRadius: '8px' }}>Les avis vérifiés seront affichés ici dès qu’ils seront disponibles.</p>
                  </div>
                </div>
              )}

              {/* FAQ */}
              {landingPage.faq.length > 0 && (
                <div style={{ padding: '60px 20px', background: '#fff' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
                    <div style={{ flex: '1 1 40%', minWidth: '280px' }}>
                      <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111', marginBottom: '16px' }}>Questions Fréquentes</h2>
                      <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '40px' }}>Découvrez comment ce produit révolutionne votre quotidien en rendant vos tâches aussi simples, rapides et efficaces que jamais auparavant.</p>
                      <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1d4ed8', margin: '0 0 12px' }}>Besoin d&apos;un coup de main supplémentaire ?</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.5' }}>Notre équipe est disponible 7j/7 pour vous accompagner et répondre à toutes vos interrogations.</p>
                      </div>
                    </div>
                    <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
                      {landingPage.faq.map((f, i) => (
                        <details key={i} style={{ borderBottom: '1px solid #eaeaea', padding: '20px 0', cursor: 'pointer' }}>
                          <summary style={{ fontWeight: '600', fontSize: '16px', color: '#111', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {f.question}
                            <span style={{ fontSize: '24px', color: '#666', fontWeight: '300' }}>+</span>
                          </summary>
                          <p style={{ margin: '16px 0 0', fontSize: '15px', color: '#555', lineHeight: '1.6' }}>{f.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
