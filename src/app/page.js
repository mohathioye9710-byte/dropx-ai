import { DollarSign, TrendingUp, Package, Activity, Clock } from 'lucide-react';
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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>Welcome back, {session.user.name.split(' ')[0]}! Here's what's happening with your stores.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <DollarSign className={styles.statIcon} style={{ color: '#fff' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Revenue</p>
            <h3 className={styles.statValue}>$0.00</h3>
            <p className={styles.statChange} style={{ color: 'rgba(255,255,255,0.4)' }}>No data this week</p>
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <TrendingUp className={styles.statIcon} style={{ color: '#fff' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Active Campaigns</p>
            <h3 className={styles.statValue}>0</h3>
            <p className={styles.statChange} style={{ color: 'rgba(255,255,255,0.4)' }}>Connect Ad Account</p>
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <Package className={styles.statIcon} style={{ color: '#fff' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Products Synced</p>
            <h3 className={styles.statValue}>0</h3>
            <p className={styles.statChange} style={{ color: 'rgba(255,255,255,0.4)' }}>To Shopify</p>
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <Activity className={styles.statIcon} style={{ color: '#fff' }} size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Winning Found</p>
            <h3 className={styles.statValue}>0</h3>
            <p className={styles.statChange} style={{ color: 'rgba(255,255,255,0.4)' }}>Based on AI metrics</p>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={`glass-panel ${styles.chartSection}`}>
          <h2 className={styles.sectionTitle}>Revenue Overview</h2>
          <div className={styles.placeholderChart}>
            <div className={styles.chartBar} style={{ height: '40%' }}></div>
            <div className={styles.chartBar} style={{ height: '60%' }}></div>
            <div className={styles.chartBar} style={{ height: '30%' }}></div>
            <div className={styles.chartBar} style={{ height: '80%' }}></div>
            <div className={styles.chartBar} style={{ height: '50%' }}></div>
            <div className={styles.chartBar} style={{ height: '90%' }}></div>
            <div className={styles.chartBar} style={{ height: '70%' }}></div>
          </div>
        </div>

        <div className={`glass-panel ${styles.activitySection}`}>
          <h2 className={styles.sectionTitle}>Recent AI Actions</h2>
          <div className={styles.activityList} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>
                No recent actions. Start by analyzing a product!
              </div>
            ) : (
              activities.map(activity => (
                <div key={activity.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px' }}>
                    <Clock size={20} color="#fff" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>{activity.description}</h4>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
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
