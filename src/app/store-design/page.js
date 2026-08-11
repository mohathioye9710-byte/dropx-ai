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
      
      if (!res.ok) throw new Error(data.error || "Erreur lors de l&apos;application");
      
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
          <p className={styles.subtitle}>Transforme ta boutique Shopify en marque premium gr&acirc;ce &agrave; l&apos;IA.</p>
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
                <h3>L&apos;IA con&ccedil;oit votre identit&eacute; visuelle...</h3>
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
                  <Sparkles size={20} /> Design g&eacute;n&eacute;r&eacute; par l&apos;IA
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
                  
                  {/* Simulated Store - Product Page Layout */}
                  <div className={styles.storeMockup} style={{ background: branding.colors.background }}>
                    
                    {/* Announcement Bar */}
                    <div className={styles.mockAnnouncement} style={{ 
                      background: branding.colors.announcementBg, 
                      color: branding.colors.announcementText 
                    }}>
                      {branding.announcementText}
                    </div>

                    {/* Navigation */}
                    <div className={styles.mockHeader}>
                      <div className={styles.mockNav} style={{ color: branding.colors.announcementBg }}>
                        <span style={{fontWeight: 'bold', fontSize: '14px'}}>{branding.storeName}</span>
                        <span style={{fontSize: '12px', marginLeft: '20px'}}>Catalog</span>
                        <span style={{fontSize: '12px', marginLeft: '10px'}}>Contact</span>
                      </div>
                    </div>

                    {/* Product Page 2-Column Layout */}
                    <div style={{ display: 'flex', padding: '30px', gap: '40px' }}>
                      
                      {/* Left Column: Product Images */}
                      <div style={{ flex: 1 }}>
                        {/* Main Image */}
                        <div style={{ 
                          width: '100%', 
                          aspectRatio: '1', 
                          background: '#f5f5f5', 
                          borderRadius: '8px', 
                          border: '1px solid #e0e0e0',
                          marginBottom: '10px'
                        }}></div>
                        {/* Thumbnails */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1, aspectRatio: '1', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0' }}></div>
                          <div style={{ flex: 1, aspectRatio: '1', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0' }}></div>
                          <div style={{ flex: 1, aspectRatio: '1', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0' }}></div>
                          <div style={{ flex: 1, aspectRatio: '1', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0' }}></div>
                        </div>
                      </div>

                      {/* Right Column: Product Details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>HAUTE QUALITÉ</div>
                        
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: branding.colors.text, lineHeight: '1.2' }}>
                          {branding.heroTitle}
                        </h1>

                        {/* Price Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: branding.colors.secondary, padding: '4px 10px', background: `${branding.colors.secondary}22`, borderRadius: '4px' }}>
                            42,85 $US
                          </span>
                          <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#999' }}>
                            68,56 $US
                          </span>
                          <span style={{ fontSize: '12px', color: branding.colors.secondary, background: `${branding.colors.secondary}11`, padding: '2px 6px', border: `1px solid ${branding.colors.secondary}44`, borderRadius: '4px' }}>
                            Économisez 38%
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', margin: '10px 0' }}>
                          {branding.heroSubtitle}. {branding.aboutText}
                        </p>

                        {/* Bundle Section */}
                        <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '5px' }}>
                          BUNDLE & ÉCONOMIES
                        </div>

                        {/* Bundle 1 (Selected) */}
                        <div style={{ 
                          border: `2px solid ${branding.colors.primary}`, 
                          borderRadius: '8px', 
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: `${branding.colors.primary}05`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `4px solid ${branding.colors.primary}`, background: '#fff' }}></div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: branding.colors.text }}>Pack Découverte (1 Unité)</div>
                              <div style={{ fontSize: '11px', color: '#888' }}>ÉCONOMISEZ 38%</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: branding.colors.text }}>42,85 $US</div>
                            <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#999' }}>68,56 $US</div>
                          </div>
                        </div>

                        {/* Bundle 2 (Unselected) */}
                        <div style={{ 
                          border: '1px solid #e0e0e0', 
                          borderRadius: '8px', 
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative',
                          marginTop: '10px'
                        }}>
                          <div style={{ position: 'absolute', top: '-10px', right: '10px', background: branding.colors.secondary, color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Le plus populaire</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #ccc' }}></div>
                            <div>
                              <div style={{ fontSize: '13px', color: branding.colors.text }}>2 Achetés = 1 OFFERT</div>
                              <div style={{ fontSize: '11px', color: '#888' }}>VOUS RECEVEZ 3 UNITÉS AU TOTAL !</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: branding.colors.text }}>85,70 $US</div>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button style={{ 
                          background: branding.colors.buttonBg, 
                          color: branding.colors.buttonText,
                          width: '100%',
                          padding: '15px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}>
                          Ajouter au Panier
                        </button>
                      </div>
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
