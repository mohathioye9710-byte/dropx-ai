"use client";

import { Bell, Search, LogOut } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import styles from './Topbar.module.css';

export default function Topbar() {
  const { data: session } = useSession();
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
        <button className={styles.iconButton}>
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <img 
              src={session.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user?.email}`} 
              alt="Profile" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} 
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
