"use client";

import { Bell, Search, LogOut } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [expandedNotifs, setExpandedNotifs] = useState([]);
  const router = useRouter();

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={18} />
        <input 
          type="text" 
          placeholder="Search products, campaigns..." 
          className={styles.searchInput}
        />
      </div>
      
      <div className={styles.actions}>
        <div style={{ position: 'relative' }}>
          <button 
            className={styles.iconButton}
            onClick={handleBellClick}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', background: 'rgba(15, 15, 30, 0.98)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', width: '320px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', zIndex: 50 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: 0 }}>Notifications</h4>
                {unreadCount === 0 && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>Toutes lues</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className={styles.notificationItem}
                  onClick={() => setExpandedNotifs(prev => prev.includes(1) ? prev.filter(id => id !== 1) : [...prev, 1])}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px', flexShrink: 0 }}></div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', marginBottom: '4px', margin: 0 }}>Bienvenue sur DropX AI 🚀</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: 1.4, margin: 0, 
                                display: '-webkit-box', WebkitLineClamp: expandedNotifs.includes(1) ? 'none' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      Votre compte a été activé avec succès. Commencez par analyser un produit dans la section générateur pour créer votre première boutique !
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '6px', margin: 0 }}>Il y a 1 heure</p>
                  </div>
                </button>
                <button 
                  className={styles.notificationItem}
                  onClick={() => setExpandedNotifs(prev => prev.includes(2) ? prev.filter(id => id !== 2) : [...prev, 2])}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '6px', flexShrink: 0 }}></div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', marginBottom: '4px', margin: 0 }}>Nouveau : Analyse de tendances IA</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: 1.4, margin: 0,
                                display: '-webkit-box', WebkitLineClamp: expandedNotifs.includes(2) ? 'none' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      Notre IA croise désormais les avis et les tendances pour trouver les audiences rentables. Vous remarquerez que les options "Laisser l'IA choisir" sont beaucoup plus intelligentes !
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '6px', margin: 0 }}>Il y a 2 heures</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <img 
              src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${session.user?.email || session.user?.name || 'DropX'}`} 
              alt="Profile" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)' }} 
            />
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
