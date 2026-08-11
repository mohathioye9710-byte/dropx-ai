"use client";

import { Home, GraduationCap, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/tutoriels', icon: GraduationCap, label: 'Tutoriels' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logoContainer}>
        <div className={styles.logoIcon}>D</div>
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
          <div className={styles.avatarContainer} onClick={() => signOut()} title="Déconnexion">
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
