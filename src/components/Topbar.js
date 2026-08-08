"use client";

import { Bell, Search, LogOut } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import styles from './Topbar.module.css';

export default function Topbar() {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
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
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            <span className={styles.badge}>0</span>
          </button>
          
          {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'rgba(15, 15, 30, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', width: '280px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 50 }}>
              <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Notifications</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>Aucune nouvelle notification.</p>
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
