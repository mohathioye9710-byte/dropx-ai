import { DollarSign, TrendingUp, Package, Activity, Clock, BarChart3, ChevronRight, Zap } from 'lucide-react';
import styles from './Dashboard.module.css';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import LandingPage from '@/components/LandingPage';
import { prisma } from '@/lib/prisma';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  const activities = await prisma.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>Welcome back, <strong style={{ color: '#fff' }}>{session.user.name.split(' ')[0]}</strong>! Here's what's happening today.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cardViolet} delay-1`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <DollarSign style={{ color: '#a78bfa' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Revenue</p>
            <h3 className={styles.statValue}>$0.00</h3>
            <p className={styles.statChange} style={{ color: '#94a3b8' }}>
              <TrendingUp size={14} color="#94a3b8" /> No data this week
            </p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.cardBlue} delay-2`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Activity style={{ color: '#60a5fa' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Active Campaigns</p>
            <h3 className={styles.statValue}>0</h3>
            <p className={styles.statChange} style={{ color: '#94a3b8' }}>
              Connect Ad Account
            </p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.cardEmerald} delay-3`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Package style={{ color: '#34d399' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Products Synced</p>
            <h3 className={styles.statValue}>0</h3>
            <p className={styles.statChange} style={{ color: '#94a3b8' }}>
              To Shopify
            </p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.cardPink} delay-4`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <Zap style={{ color: '#f472b6' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Winning Found</p>
            <h3 className={styles.statValue}>0</h3>
            <p className={styles.statChange} style={{ color: '#94a3b8' }}>
              Based on AI metrics
            </p>
          </div>
        </div>
      </div>

      <div className={`${styles.mainGrid} delay-5`}>
        <div className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className={styles.sectionTitle}>
              <BarChart3 size={20} color="#a78bfa" /> Revenue Overview
            </h2>
            <button style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Last 7 Days <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.placeholderChart}>
            <div className={styles.chartBar} style={{ height: '40%', animationDelay: '0.1s' }}></div>
            <div className={styles.chartBar} style={{ height: '60%', animationDelay: '0.2s' }}></div>
            <div className={styles.chartBar} style={{ height: '30%', animationDelay: '0.3s' }}></div>
            <div className={styles.chartBar} style={{ height: '80%', animationDelay: '0.4s' }}></div>
            <div className={styles.chartBar} style={{ height: '50%', animationDelay: '0.5s' }}></div>
            <div className={styles.chartBar} style={{ height: '90%', animationDelay: '0.6s' }}></div>
            <div className={styles.chartBar} style={{ height: '70%', animationDelay: '0.7s' }}></div>
          </div>
        </div>

        <div className={styles.activitySection}>
          <h2 className={styles.sectionTitle}>
            <Clock size={20} color="#60a5fa" /> Recent AI Actions
          </h2>
          <div className={styles.activityList}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                No recent actions. Start by analyzing a product!
              </div>
            ) : (
              activities.map((activity, i) => (
                <div key={activity.id} className={styles.activityItem} style={{ animationDelay: `${0.1 * i}s` }}>
                  <div className={styles.activityIcon} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                    <Zap size={16} />
                  </div>
                  <div className={styles.activityDetails}>
                    <h4 className={styles.activityTitle}>{activity.description}</h4>
                    <p className={styles.activityTime}>
                      {activity.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
