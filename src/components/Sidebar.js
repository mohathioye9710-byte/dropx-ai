"use client";

import { Home, Search, Store, Palette, Video, Share2, Settings, GraduationCap, LogIn, LogOut, Activity, ShoppingBag } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Dashboard', shortLabel: 'Accueil' },
  { href: '/ads', icon: Video, label: 'Ads Studio IA (Vidéos TikTok & Reels)', shortLabel: 'Ads Studio', badge: 'IA' },
  { href: '/orders', icon: ShoppingBag, label: 'Commandes COD (Sénégal)', shortLabel: 'Commandes' },
  { href: '/analyzer', icon: Search, label: 'Recherche de Produits', shortLabel: 'Produits' },
  { href: '/stores', icon: Store, label: 'Mes Boutiques', shortLabel: 'Boutiques' },
  { href: '/store-design', icon: Palette, label: 'Design Boutique', shortLabel: 'Design' },
  { href: '/analytics', icon: Activity, label: 'Analytics & Ventes', shortLabel: 'Stats' },
  { href: '/social', icon: Share2, label: 'Réseaux Sociaux', shortLabel: 'Social' },
  { href: '/tutoriels', icon: GraduationCap, label: 'Tutoriels Vidéo', shortLabel: 'Tutos' },
  { href: '/settings', icon: Settings, label: 'Paramètres', shortLabel: 'Réglages' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logoContainer} style={{ textDecoration: 'none' }} title="DropX">
        <img src="/logo.png" alt="DropX" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
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
            >
              <div className={styles.iconWrapper}>
                <Icon size={20} strokeWidth={2.2} />
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </div>
              <span className={styles.navLabel}>{item.shortLabel || item.label}</span>
              <div className={styles.tooltip}>{item.label}</div>
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
