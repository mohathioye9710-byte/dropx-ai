"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import styles from './page.module.css';
import { User, Mail, Bell, CreditCard, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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
              <div className={styles.profileCard}>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '14px' }}>
                  Connectez votre boutique Shopify pour récupérer vos vraies commandes, revenus et statistiques en temps réel.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    const domain = e.target.domain.value;
                    const token = e.target.token.value;
                    try {
                      const res = await fetch('/api/integrations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ platform: 'shopify', domain, token })
                      });
                      if (res.ok) {
                        alert("Boutique Shopify connectée avec succès !");
                      } else {
                        const err = await res.json();
                        alert("Erreur: " + (err.error || "Échec de la connexion"));
                      }
                    } catch (error) {
                      alert("Erreur de connexion serveur.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <div className={styles.formGroup}>
                    <label>URL de la Boutique (.myshopify.com)</label>
                    <input 
                      type="text" 
                      name="domain"
                      placeholder="ma-boutique.myshopify.com" 
                      required 
                      className={styles.input} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Jeton d'accès (Admin API Token)</label>
                    <input 
                      type="password" 
                      name="token"
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx" 
                      required 
                      className={styles.input} 
                    />
                    <span className={styles.hint}>
                      Créez une application personnalisée dans Shopify avec les droits `read_orders`.
                    </span>
                  </div>
                  <button type="submit" disabled={loading} className={styles.saveButton}>
                    {loading ? 'Connexion...' : 'Connecter Shopify'}
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
