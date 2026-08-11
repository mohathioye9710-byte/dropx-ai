"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from './page.module.css';
import { User, Mail, Bell, CreditCard, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [shopifyStatus, setShopifyStatus] = useState(null);
  const [existingIntegration, setExistingIntegration] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL params for Shopify connection result
    const shopifyParam = searchParams.get('shopify');
    const errorParam = searchParams.get('error');
    if (shopifyParam === 'connected') {
      setShopifyStatus('success');
      setActiveTab('integrations');
    } else if (errorParam) {
      setShopifyStatus('error');
      setActiveTab('integrations');
    }

    // Fetch existing integration status
    const fetchIntegration = async () => {
      try {
        const res = await fetch('/api/integrations');
        const data = await res.json();
        if (data.connected) {
          setExistingIntegration(data.domain);
        }
      } catch (err) {
        console.error("Failed to fetch integration", err);
      }
    };
    fetchIntegration();
  }, [searchParams]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleShopifyConnect = (e) => {
    e.preventDefault();
    const domain = e.target.domain.value.trim();
    if (!domain) return;
    // Redirect to our OAuth initiation route
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  };

  const handleDisconnect = async () => {
    // Normally you'd want an API route to actually delete the integration
    // But for this UI update, we'll just show how it would look
    alert("Fonctionnalité de déconnexion à implémenter. Pour l'instant, vous pouvez vous reconnecter avec une autre boutique pour l'écraser.");
    setExistingIntegration(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Paramètres</h1>
        <p className={styles.subtitle}>Gérez vos informations personnelles et vos préférences.</p>
      </header>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Mon Profil
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'billing' ? styles.active : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <CreditCard size={18} /> Abonnement
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Sécurité
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'integrations' ? styles.active : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            <Globe size={18} /> Intégrations
          </button>
        </div>

        <div className={styles.mainSettings}>
          {activeTab === 'profile' && (
            <>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Profil Public</h2>
                <div className={styles.profileCard}>
                  <div className={styles.avatarWrapper}>
                    <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${session?.user?.email || session?.user?.name || 'DropX'}`} alt="Avatar" className={styles.avatar} style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <button className={styles.editAvatar}>Modifier</button>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nom complet</label>
                    <input type="text" defaultValue={session?.user?.name || ''} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Adresse Email</label>
                    <div className={styles.inputWithIcon}>
                      <Mail size={16} className={styles.inputIcon} />
                      <input type="email" defaultValue={session?.user?.email || ''} readOnly className={styles.input} />
                    </div>
                    <span className={styles.hint}>Lié à votre compte Google.</span>
                  </div>
                </div>
                <button className={styles.saveButton}>Enregistrer les modifications</button>
              </section>

              <section className={`${styles.section} ${styles.dangerZone}`}>
                <h2 className={`${styles.sectionTitle} ${styles.dangerText}`}>Zone de Danger</h2>
                <div className={styles.dangerCard}>
                  <div className={styles.dangerInfo}>
                    <h4>Supprimer le compte</h4>
                    <p>La suppression de votre compte effacera toutes vos données et boutiques connectées de manière permanente.</p>
                  </div>
                  <button className={styles.deleteButton}>Supprimer mon compte</button>
                </div>
              </section>
            </>
          )}

          {activeTab === 'billing' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Abonnement actuel</h2>
              <div className={styles.subscriptionCard}>
                <div className={styles.subInfo}>
                  <span className={styles.planBadge}>DropX Free</span>
                  <p>Vous utilisez actuellement le plan gratuit. Passez à la version Pro pour débloquer toutes les fonctionnalités d'IA et synchroniser des boutiques illimitées.</p>
                </div>
                <button
                  className={styles.upgradeButton}
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? 'Redirection...' : 'Passer au Plan Pro'}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Préférences de Notifications</h2>
              <div className={styles.profileCard} style={{ padding: '24px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Configurez comment vous souhaitez être contacté.</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '15px' }}>Emails Promotionnels</h4>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Recevoir des offres et nouveautés</p>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#10b981' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '15px' }}>Alertes d'analyse</h4>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Quand un produit gagne en popularité</p>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#10b981' }} />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Sécurité du Compte</h2>
              <div className={styles.profileCard} style={{ padding: '24px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Votre compte est sécurisé via Google OAuth.</p>

                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Shield color="#10b981" size={24} />
                  <div>
                    <h4 style={{ color: '#10b981', marginBottom: '4px' }}>Authentification Google activée</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.5 }}>
                      Vous utilisez un fournisseur d'identité externe (Google). Votre mot de passe est géré par eux, ce qui garantit un haut niveau de sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'integrations' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Intégrations (Shopify)</h2>

              {/* Success / Error banners */}
              {shopifyStatus === 'success' && (
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <h4 style={{ color: '#10b981', marginBottom: '4px' }}>Boutique Shopify connectée avec succès !</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Vos données de ventes apparaîtront maintenant sur le Dashboard en temps réel.</p>
                  </div>
                </div>
              )}
              {shopifyStatus === 'error' && (
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>❌</span>
                  <div>
                    <h4 style={{ color: '#ef4444', marginBottom: '4px' }}>Erreur de connexion Shopify</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>La connexion a échoué. Vérifiez l'URL de votre boutique et réessayez.</p>
                  </div>
                </div>
              )}

              <div className={styles.profileCard}>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '14px' }}>
                  Connectez votre boutique Shopify pour récupérer vos vraies commandes, revenus et statistiques en temps réel. La connexion se fait en un clic via le système sécurisé de Shopify.
                </p>
                <form onSubmit={handleShopifyConnect}>
                  <div className={styles.formGroup}>
                    <label>URL de la Boutique (.myshopify.com)</label>
                    <input 
                      type="text" 
                      name="domain"
                      defaultValue={existingIntegration || ''}
                      placeholder="ma-boutique.myshopify.com" 
                      required 
                      disabled={!!existingIntegration}
                      className={styles.input} 
                    />
                    <span className={styles.hint}>
                      {existingIntegration 
                        ? "Votre boutique est connectée. Si vous souhaitez la changer, déconnectez-la d'abord."
                        : "Entrez l'URL de votre boutique Shopify. Vous serez redirigé vers Shopify pour autoriser la connexion."}
                    </span>
                  </div>
                  {existingIntegration ? (
                    <button type="button" onClick={handleDisconnect} className={styles.saveButton} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                      Changer de boutique
                    </button>
                  ) : (
                    <button type="submit" className={styles.saveButton} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} /> Connecter Shopify
                    </button>
                  )}
                </form>
              </div>

              {/* Pixel de Tracking Section */}
              {existingIntegration && (
                <div className={styles.profileCard} style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px' }}>📡</span>
                    </div>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '2px' }}>Pixel de Tracking DropX</h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Installez ce pixel pour suivre les visites et ajouts au panier</p>
                    </div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                    Pour que DropX puisse suivre les <strong style={{ color: '#a855f7' }}>visites</strong> et les <strong style={{ color: '#a855f7' }}>ajouts au panier</strong> de votre boutique en temps réel, 
                    copiez le code ci-dessous et collez-le dans votre Shopify Admin &gt; <strong style={{ color: '#fff' }}>Boutique en ligne</strong> &gt; <strong style={{ color: '#fff' }}>Thèmes</strong> &gt; <strong style={{ color: '#fff' }}>Modifier le code</strong> &gt; <strong style={{ color: '#fff' }}>theme.liquid</strong>, juste avant la balise <code style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>&lt;/head&gt;</code>.
                  </p>

                  <div style={{ position: 'relative' }}>
                    <pre style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '16px',
                      color: '#10b981',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
{`<!-- DropX AI Tracking Pixel -->
<script src="https://dropx-ai.vercel.app/pixel.js?shop=${existingIntegration}" defer></script>`}
                    </pre>
                    <button
                      onClick={() => {
                        const code = `<!-- DropX AI Tracking Pixel -->\n<script src="https://dropx-ai.vercel.app/pixel.js?shop=${existingIntegration}" defer></script>`;
                        navigator.clipboard.writeText(code);
                        alert('Code copié dans le presse-papier !');
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '6px 12px',
                        background: 'rgba(168, 85, 247, 0.3)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        color: '#fff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      📋 Copier
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
