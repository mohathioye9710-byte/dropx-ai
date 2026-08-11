"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Palette, Loader2, Check, Sparkles, ExternalLink, RefreshCw, AlertTriangle, Eye, Wand2, Zap, Crown } from 'lucide-react';

export default function StoreDesignPage() {
  const [niche, setNiche] = useState('');
  const [shopStatus, setShopStatus] = useState('loading');
  const [shopInfo, setShopInfo] = useState(null);
  const [branding, setBranding] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState('desktop');

  useEffect(() => {
    fetch('/api/integrations')
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setShopStatus('connected');
          setShopInfo({ url: data.domain });
        } else {
          setShopStatus('disconnected');
        }
      })
      .catch(() => setShopStatus('disconnected'));
  }, []);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setGenerating(true);
    setError('');
    setBranding(null);
    setApplied(false);

    try {
      const res = await fetch('/api/store-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', niche: niche.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setBranding(data.branding);
      if (data.currentShop) setShopInfo(prev => ({ ...prev, ...data.currentShop }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!branding) return;
    setApplying(true);
    setError('');

    try {
      const res = await fetch('/api/store-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', branding })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'application");
      
      if (data.results && data.results.errors && data.results.errors.length > 0) {
        setError(data.message + " " + data.results.errors.join(' '));
      }
      setApplied(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background effects */}
      <div className={styles.orbPurple}></div>
      <div className={styles.orbBlue}></div>
      <div className={styles.orbPink}></div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Wand2 size={28} />
        </div>
        <div>
          <h1 className={styles.title}>Store Design IA</h1>
          <p className={styles.subtitle}>Transforme ta boutique Shopify en marque premium grâce à l&apos;IA.</p>
        </div>
        <div className={styles.headerBadge}>
          <Crown size={14} /> Powered by GPT-4 + DALL·E
        </div>
      </header>

      {/* Connection Status */}
      <div className={styles.statusBar}>
        {shopStatus === 'loading' && (
          <div className={styles.statusLoading}>
            <Loader2 size={16} className={styles.spin} /> Vérification de la connexion Shopify...
          </div>
        )}
        {shopStatus === 'connected' && (
          <div className={styles.statusConnected}>
            <Check size={16} /> Boutique connectée : <strong>{shopInfo?.url || shopInfo?.name}</strong>
          </div>
        )}
        {shopStatus === 'disconnected' && (
          <div className={styles.statusDisconnected}>
            <AlertTriangle size={16} /> Aucune boutique connectée.{' '}
            <a href="/settings" className={styles.connectLink}>Connecter maintenant →</a>
          </div>
        )}
      </div>

      {shopStatus === 'connected' && (
        <>
          {/* Input Section */}
          <div className={styles.inputSection}>
            <label className={styles.inputLabel}>
              <Sparkles size={14} style={{ color: '#c084fc' }} /> Décris ta niche ou ton style en une phrase
            </label>
            <div className={styles.inputRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: Boutique premium de gadgets tech futuristes"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                disabled={generating}
              />
              <button 
                className={styles.generateBtn} 
                onClick={handleGenerate} 
                disabled={generating || !niche.trim()}
              >
                {generating ? (
                  <><Loader2 size={18} className={styles.spin} /> Génération...</>
                ) : (
                  <><Zap size={18} /> Générer le design</>
                )}
              </button>
            </div>
            <div className={styles.suggestions}>
              {['Gadgets tech futuristes', 'Mode streetwear premium', 'Cosmétiques bio luxe', 'Accessoires gaming'].map(s => (
                <button key={s} className={styles.suggestionChip} onClick={() => setNiche(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generating Animation */}
          {generating && (
            <div className={styles.generatingOverlay}>
              <div className={styles.generatingCard}>
                <div className={styles.generatingPulse}>
                  <Wand2 size={32} />
                </div>
                <h3>L&apos;IA conçoit votre identité visuelle...</h3>
                <p>Analyse des produits, création de la palette, génération du branding</p>
                <div className={styles.generatingSteps}>
                  <div className={styles.generatingStep}>
                    <div className={`${styles.stepDot} ${styles.stepActive}`}></div>
                    <span>Analyse des produits</span>
                  </div>
                  <div className={styles.generatingStep}>
                    <div className={`${styles.stepDot} ${styles.stepActive}`}></div>
                    <span>Création palette couleurs</span>
                  </div>
                  <div className={styles.generatingStep}>
                    <div className={styles.stepDot}></div>
                    <span>Rédaction du branding</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorBox}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Premium Branding Preview */}
          {branding && !generating && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <h2 className={styles.previewTitle}>
                  <Sparkles size={20} /> Design généré par l&apos;IA
                </h2>
                <div className={styles.previewTabs}>
                  {['desktop', 'identity', 'colors'].map(tab => (
                    <button 
                      key={tab}
                      className={`${styles.previewTab} ${activePreviewTab === tab ? styles.previewTabActive : ''}`}
                      onClick={() => setActivePreviewTab(tab)}
                    >
                      {tab === 'desktop' ? '🖥️ Aperçu Live' : tab === 'identity' ? '🎨 Identité' : '🌈 Couleurs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: Live Preview — Full Store Mockup */}
              {activePreviewTab === 'desktop' && (
                <div className={styles.livePreview}>
                  {/* Browser Chrome */}
                  <div className={styles.browserChrome}>
                    <div className={styles.browserDots}>
                      <span className={styles.dotRed}></span>
                      <span className={styles.dotYellow}></span>
                      <span className={styles.dotGreen}></span>
                    </div>
                    <div className={styles.browserUrl}>
                      <span>🔒</span> {shopInfo?.url || 'ma-boutique.myshopify.com'}
                    </div>
                  </div>
                  
                  {/* Simulated Store */}
                  <div className={styles.storeMockup} style={{ background: branding.colors.background }}>
                    {/* Announcement Bar */}
                    <div className={styles.mockAnnouncement} style={{ 
                      background: branding.colors.announcementBg, 
                      color: branding.colors.announcementText 
                    }}>
                      {branding.announcementText}
                    </div>

                    {/* Desktop / Mobile Toggle */}
                    <div className={styles.mockNav}>
                      <div className={styles.mockLogo} style={{ color: branding.colors.text }}>{branding.storeName}</div>
                      <div className={styles.mockNavLinks} style={{ color: branding.colors.text }}>
                        <span>Collection</span>
                        <span>À Propos</span>
                        <span>Contact</span>
                      </div>
                    </div>

                    {/* Hero Section */}
                    <div className={styles.mockHero} style={{ 
                      background: branding.colors.background,
                      color: branding.colors.text
                    }}>
                      <div className={styles.mockHeroContent}>
                        <span className={styles.mockBadge} style={{ 
                          color: branding.colors.primary, 
                          border: `1px solid ${branding.colors.primary}40`,
                          background: `${branding.colors.primary}10`
                        }}>
                          {branding.vibe.toUpperCase()}
                        </span>
                        <h1 className={styles.mockHeroTitle}>{branding.heroTitle}</h1>
                        <p className={styles.mockHeroSub}>{branding.heroSubtitle}</p>
                        <button className={styles.mockHeroBtn} style={{ 
                          background: branding.colors.buttonBg, 
                          color: branding.colors.buttonText
                        }}>
                          Catalogue
                        </button>
                      </div>
                    </div>

                  {/* Marquee */}
                  <div className={styles.mockMarquee} style={{ 
                    background: branding.colors.announcementBg,
                    borderTop: `1px solid ${branding.colors.primary}22`,
                    borderBottom: `1px solid ${branding.colors.primary}22`,
                    color: branding.colors.announcementText
                  }}>
                    <div className={styles.mockMarqueeTrack}>
                      {'✦ ' + branding.storeName + ' ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ '.repeat(3)}
                    </div>
                  </div>

                  {/* Product Grid Placeholder */}
                  <div className={styles.mockProductGrid} style={{ background: branding.colors.background }}>
                    {(shopInfo?.products && shopInfo.products.length > 0 ? shopInfo.products.slice(0, 3) : [{id:1}, {id:2}, {id:3}]).map((p, i) => (
                      <div key={p.id || i} className={styles.mockProduct} style={{ 
                        background: '#ffffff',
                        border: `1px solid #eaeaea`,
                        boxShadow: `0 4px 12px rgba(0,0,0,0.05)`,
                        borderRadius: '0px',
                        overflow: 'hidden'
                      }}>
                        <div className={styles.mockProductImage} style={{ 
                          background: '#f9f9f9',
                          borderBottom: `1px solid #eaeaea`,
                          backgroundImage: p.image ? `url(${p.image})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}></div>
                        <div className={styles.mockProductInfo} style={{ padding: '16px' }}>
                          <div className={styles.mockProductTitle} style={p.title ? { color: branding.colors.text, fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' } : { background: branding.colors.text + '20', height: '16px', borderRadius: '4px', marginBottom: '8px' }}>
                            {p.title || ''}
                          </div>
                          <div className={styles.mockProductPrice} style={p.price ? { color: branding.colors.primary, fontSize: '14px', fontWeight: 'bold' } : { background: branding.colors.primary, height: '24px', width: '50%', borderRadius: '4px' }}>
                            {p.price ? `${p.price} €` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Brand Identity */}
              {activePreviewTab === 'identity' && (
                <div className={styles.identityGrid}>
                  {/* Store Name Card */}
                  <div className={styles.identityCard}>
                    <div className={styles.identityCardHeader}>
                      <span className={styles.identityIcon}>✏️</span>
                      <span className={styles.identityLabel}>Nom de la Marque</span>
                    </div>
                    <h3 className={styles.identityStoreName}>{branding.storeName}</h3>
                    <span className={styles.identityVibe}>{branding.vibe}</span>
                  </div>

                  {/* Typography Card */}
                  <div className={styles.identityCard}>
                    <div className={styles.identityCardHeader}>
                      <span className={styles.identityIcon}>🔤</span>
                      <span className={styles.identityLabel}>Typographie</span>
                    </div>
                    <div className={styles.typographyShowcase}>
                      <span className={styles.fontDisplay} style={{ fontFamily: branding.font }}>{branding.font}</span>
                      <div className={styles.fontSamples}>
                        <span style={{ fontFamily: branding.font, fontWeight: 800, fontSize: '20px' }}>Aa Bb Cc</span>
                        <span style={{ fontFamily: branding.font, fontWeight: 400, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>abcdefghijklmnopqrstuvwxyz</span>
                        <span style={{ fontFamily: branding.font, fontWeight: 400, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>0123456789</span>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Bar Card */}
                  <div className={`${styles.identityCard} ${styles.identityCardWide}`}>
                    <div className={styles.identityCardHeader}>
                      <span className={styles.identityIcon}>📢</span>
                      <span className={styles.identityLabel}>Barre d&apos;annonce</span>
                    </div>
                    <div className={styles.announcementShowcase} style={{
                      background: branding.colors.announcementBg,
                      color: branding.colors.announcementText
                    }}>
                      {branding.announcementText}
                    </div>
                  </div>

                  {/* Hero Text Card */}
                  <div className={`${styles.identityCard} ${styles.identityCardWide}`}>
                    <div className={styles.identityCardHeader}>
                      <span className={styles.identityIcon}>🚀</span>
                      <span className={styles.identityLabel}>Section Hero</span>
                    </div>
                    <div className={styles.heroShowcase} style={{ 
                      background: `linear-gradient(135deg, ${branding.colors.primary}15, ${branding.colors.secondary}15)` 
                    }}>
                      <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{branding.heroTitle}</h3>
                      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>{branding.heroSubtitle}</p>
                      <div style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '50px', background: branding.colors.buttonBg, color: branding.colors.buttonText, fontSize: '13px', fontWeight: 700 }}>
                        Découvrir ✨
                      </div>
                    </div>
                  </div>

                  {/* About Text Card */}
                  <div className={`${styles.identityCard} ${styles.identityCardWide}`}>
                    <div className={styles.identityCardHeader}>
                      <span className={styles.identityIcon}>💎</span>
                      <span className={styles.identityLabel}>À Propos</span>
                    </div>
                    <p className={styles.aboutShowcase}>{branding.aboutText}</p>
                  </div>
                </div>
              )}

              {/* TAB 3: Colors */}
              {activePreviewTab === 'colors' && (
                <div className={styles.colorsSection}>
                  <div className={styles.colorPaletteVisual}>
                    {Object.entries(branding.colors).map(([key, color]) => (
                      <div key={key} className={styles.colorBlock}>
                        <div className={styles.colorBlockSwatch} style={{ background: color }}>
                          <span className={styles.colorBlockHex}>{color}</span>
                        </div>
                        <span className={styles.colorBlockName}>{key}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Color Contrast Preview */}
                  <div className={styles.contrastPreview}>
                    <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Aperçu Contraste</h4>
                    <div className={styles.contrastCards}>
                      <div style={{ background: branding.colors.background, color: branding.colors.text, padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Texte sur fond</h5>
                        <p style={{ fontSize: '13px', opacity: 0.7 }}>Lorem ipsum dolor sit amet</p>
                      </div>
                      <div style={{ background: branding.colors.buttonBg, color: branding.colors.buttonText, padding: '20px', borderRadius: '12px' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Bouton CTA</h5>
                        <p style={{ fontSize: '13px', opacity: 0.8 }}>Ajouter au panier</p>
                      </div>
                      <div style={{ background: branding.colors.announcementBg, color: branding.colors.announcementText, padding: '20px', borderRadius: '12px' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Barre annonce</h5>
                        <p style={{ fontSize: '13px', opacity: 0.8 }}>{branding.announcementText?.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Section */}
              <div className={styles.applySection}>
                {applied ? (
                  <div className={styles.appliedMsg} style={error ? { borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.05)' } : {}}>
                    <div className={styles.appliedIcon}>{error ? '⚠️' : '🎉'}</div>
                    <div>
                      <h4 style={error ? { color: '#f59e0b' } : {}}>{error ? 'Application partielle' : 'Design appliqué avec succès !'}</h4>
                      <p>{error || "Votre boutique a été entièrement redesignée par l'IA."}</p>
                    </div>
                    <a href={`https://${shopInfo?.url}`} target="_blank" rel="noopener noreferrer" className={styles.viewStoreLink}>
                      Voir ma boutique <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <div className={styles.applyRow}>
                    <button className={styles.regenerateBtn} onClick={handleGenerate} disabled={generating}>
                      <RefreshCw size={16} /> Régénérer
                    </button>
                    <button className={styles.applyBtn} onClick={handleApply} disabled={applying}>
                      {applying ? (
                        <><Loader2 size={18} className={styles.spin} /> Application en cours...</>
                      ) : (
                        <><Zap size={18} /> Appliquer sur Shopify</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
