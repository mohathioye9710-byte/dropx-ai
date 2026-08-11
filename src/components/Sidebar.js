"use client";

import { Home, Search, Store, Palette, Megaphone, Share2, Settings, GraduationCap, LogIn, LogOut, Activity } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/analytics', icon: Activity, label: 'Analytics' },
  { href: '/analyzer', icon: Search, label: 'Recherche de Produits' },
  { href: '/stores', icon: Store, label: 'Mes Boutiques' },
  { href: '/store-design', icon: Palette, label: 'Design' },
  { href: '/ads', icon: Megaphone, label: 'Publicités' },
  { href: '/social', icon: Share2, label: 'Réseaux Sociaux' },
  { href: '/tutoriels', icon: GraduationCap, label: 'Tutoriels' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logoContainer} style={{ textDecoration: 'none' }}>
        <img src="/logo.png" alt="ShopX" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
        <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', marginLeft: '12px' }}>ShopX</span>
      </Link>
      
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={item.label}
            >
              <Icon size={22} strokeWidth={2.5} />
            </Link>
          );
        })}
      </nav>
      
      <div className={styles.userCard}>
        {session ? (
          <div className={styles.avatarContainer} onClick={() => router.push('/settings')} title="Paramètres du Profil">
            <img 
              src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${session.user?.email || session.user?.name || 'DropX'}`} 
              alt="Profile" 
              className={styles.userAvatar}
            />
            <div className={styles.statusDot}></div>
          </div>
        ) : (
          <button onClick={() => signIn('google')} className={styles.signInBtn} title="Se Connecter">
            <LogIn size={20} />
          </button>
        )}
      </div>
    </aside>
  );
}
