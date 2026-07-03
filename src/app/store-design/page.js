"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Palette, Loader2, Check, Sparkles, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

export default function StoreDesignPage() {
  const [niche, setNiche] = useState('');
  const [shopStatus, setShopStatus] = useState('loading'); // loading, connected, disconnected
  const [shopInfo, setShopInfo] = useState(null);
  const [branding, setBranding] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/integrations/shopify')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setShopStatus('connected');
          setShopInfo({ url: data.shopUrl });
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
      setApplied(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background orbs */}
      <div className={styles.orbPurple}></div>
      <div className={styles.orbBlue}></div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Palette size={28} />
        </div>
        <div>
          <h1 className={styles.title}>Store Design IA</h1>
          <p className={styles.subtitle}>Transforme ta boutique Shopify en marque premium grâce à l'IA.</p>
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
            <a href="/shopify" className={styles.connectLink}>Connecter maintenant →</a>
          </div>
        )}
      </div>

      {shopStatus === 'connected' && (
        <>
          {/* Input Section */}
          <div className={styles.inputSection}>
            <label className={styles.inputLabel}>Décris ta niche ou ton style en une phrase</label>
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
                  <><Sparkles size={18} /> Générer le design</>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Branding Preview */}
          {branding && (
            <div className={styles.previewSection}>
              <h2 className={styles.previewTitle}>
                <Sparkles size={20} /> Aperçu du design généré
              </h2>

              <div className={styles.previewGrid}>
                {/* Store Name */}
                <div className={styles.previewCard}>
                  <span className={styles.previewLabel}>Nom de la boutique</span>
                  <span className={styles.previewValue} style={{fontSize: '24px', fontWeight: 800}}>{branding.storeName}</span>
                  <span className={styles.previewVibe}>{branding.vibe}</span>
                </div>

                {/* Colors */}
                <div className={styles.previewCard}>
                  <span className={styles.previewLabel}>Palette de couleurs</span>
                  <div className={styles.colorGrid}>
                    {Object.entries(branding.colors).map(([key, color]) => (
                      <div key={key} className={styles.colorSwatch}>
                        <div className={styles.colorCircle} style={{background: color}}></div>
                        <div className={styles.colorInfo}>
                          <span className={styles.colorName}>{key}</span>
                          <span className={styles.colorHex}>{color}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className={styles.previewCard}>
                  <span className={styles.previewLabel}>Typographie</span>
                  <span className={styles.previewValue} style={{fontFamily: branding.font, fontSize: '28px'}}>{branding.font}</span>
                  <span className={styles.previewSub}>Police principale du site</span>
                </div>

                {/* Announcement */}
                <div className={styles.previewCard}>
                  <span className={styles.previewLabel}>Barre d'annonce</span>
                  <div className={styles.announcementPreview} style={{
                    background: branding.colors.announcementBg,
                    color: branding.colors.announcementText
                  }}>
                    {branding.announcementText}
                  </div>
                </div>

                {/* Hero */}
                <div className={`${styles.previewCard} ${styles.previewCardWide}`}>
                  <span className={styles.previewLabel}>Section Hero</span>
                  <div className={styles.heroPreview} style={{background: `linear-gradient(135deg, ${branding.colors.primary}22, ${branding.colors.secondary}22)`}}>
                    <h3 className={styles.heroPreviewTitle} style={{color: branding.colors.text}}>{branding.heroTitle}</h3>
                    <p className={styles.heroPreviewSub} style={{color: branding.colors.text + '99'}}>{branding.heroSubtitle}</p>
                    <button className={styles.heroPreviewBtn} style={{
                      background: branding.colors.buttonBg,
                      color: branding.colors.buttonText
                    }}>Shop Now</button>
                  </div>
                </div>

                {/* About */}
                <div className={`${styles.previewCard} ${styles.previewCardWide}`}>
                  <span className={styles.previewLabel}>À propos</span>
                  <p className={styles.aboutText}>{branding.aboutText}</p>
                </div>
              </div>

              {/* Apply Button */}
              <div className={styles.applySection}>
                {applied ? (
                  <div className={styles.appliedMsg}>
                    <Check size={20} /> Design appliqué avec succès ! 
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
                        <><Check size={18} /> Appliquer sur Shopify</>
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
