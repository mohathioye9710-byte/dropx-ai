"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import styles from './page.module.css';
import { User, Mail, Bell, CreditCard, Shield, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

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
          <button className={`${styles.tab} ${styles.active}`}><User size={18} /> Mon Profil</button>
          <button className={styles.tab}><CreditCard size={18} /> Abonnement</button>
          <button className={styles.tab}><Bell size={18} /> Notifications</button>
          <button className={styles.tab}><Shield size={18} /> Sécurité</button>
        </div>

        <div className={styles.mainSettings}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profil Public</h2>
            <div className={styles.profileCard}>
              <div className={styles.avatarWrapper}>
                <img src={session?.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="Avatar" className={styles.avatar} />
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
        </div>
      </div>
    </div>
  );
}
