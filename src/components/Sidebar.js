"use client";

import { Home, PackageSearch, Sparkles, BarChart2, Settings, Store, PlusSquare, Share2, LogOut, LogIn, Palette } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  {
    section: 'MAIN',
    items: [
      { href: '/', icon: Home, label: 'Dashboard' },
      { href: '/analyzer', icon: Sparkles, label: 'Product Store' },
      { href: '/store-design', icon: Palette, label: 'Store Design IA' },
      { href: '/ads', icon: BarChart2, label: 'Ad Strategy' },
    ]
  },
  {
    section: 'INTEGRATIONS',
    items: [
      { href: '/stores', icon: Store, label: 'Mes Boutiques' },
      { href: '/shopify', icon: PlusSquare, label: 'Shopify Sync' },
      { href: '/social', icon: Share2, label: 'Social Media' },
    ]
  },
  {
    section: 'SYSTEM',
    items: [
      { href: '/settings', icon: Settings, label: 'Paramètres' },
    ]
  }
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}></div>
        <h1 className={styles.logoText}>DropX AI</h1>
      </div>
      
      <nav className={styles.nav}>
        {NAV_ITEMS.map((group, gIdx) => (
          <div key={group.section}>
            {gIdx > 0 && <div className={styles.navDivider}></div>}
            <p className={styles.navSection}>{group.section}</p>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      
      <div className={styles.userCard}>
        {session ? (
          <>
            <img 
              src={session.user.image || ''} 
              alt="Profile" 
              className={styles.userAvatar} 
              style={{width: '36px', height: '36px', borderRadius: '10px'}} 
            />
            <div className={styles.userInfo}>
              <p className={styles.userName}>{session.user.name}</p>
              <button onClick={() => signOut()} className={styles.signOutBtn}>
                <LogOut size={11} /> Déconnexion
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => signIn('google')} className={styles.signInBtn}>
            <LogIn size={16} /> Se Connecter
          </button>
        )}
      </div>
    </aside>
  );
}
