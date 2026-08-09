import { DollarSign, TrendingUp, Package, Activity, Clock, BarChart3, ChevronRight, Zap, Target, Filter, ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, ShoppingCart, CreditCard } from 'lucide-react';
import styles from './Dashboard.module.css';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import LandingPage from '@/components/LandingPage';
import { prisma } from '@/lib/prisma';

// Fake Data for the chart
const chartData = [
  { day: '01', value: 30 }, { day: '04', value: 45 }, { day: '07', value: 40 },
  { day: '10', value: 65 }, { day: '13', value: 55 }, { day: '16', value: 85 },
  { day: '19', value: 70 }, { day: '22', value: 95 }, { day: '25', value: 80 },
  { day: '28', value: 100 }
];

// Fake top products
const topProducts = [
  { id: 1, title: 'Mini Humidificateur Portable USB avec LED', img: 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?auto=format&fit=crop&q=80&w=150', sales: 124, conv: '4.2%', revenue: '4,340€' },
  { id: 2, title: 'Correcteur de Posture Magnétique', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150', sales: 89, conv: '3.8%', revenue: '2,670€' },
  { id: 3, title: 'Brosse Soufflante 5-en-1 Pro', img: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=150', sales: 67, conv: '2.9%', revenue: '3,216€' },
];

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className={`${styles.container} animate-fade-in`}>
      
      {/* Banner Analyser Produit (Restaurée et modernisée) */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#a855f7" /> Analyser un nouveau produit
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', maxWidth: '500px' }}>
            Collez le lien d'un produit (AliExpress, Amazon, Temu...) pour laisser notre IA générer votre boutique, votre copywriting et vos publicités.
          </p>
        </div>
        <a href="/analyzer" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', padding: '14px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}>
          <Zap size={16} /> Lancer l'analyse IA
        </a>
      </div>

      <header className={styles.header} style={{ marginTop: '16px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className={styles.title}>Analytics Overview</h1>
          <p className={styles.subtitle}>Performances des 30 derniers jours pour vos boutiques connectées.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          <Filter size={14} /> Filtrer
        </button>
      </header>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiRevenue}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Chiffre d'Affaires</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.15)' }}><DollarSign size={18} color="#818cf8" /></div>
          </div>
          <h3 className={styles.kpiValue}>12,450€</h3>
          <div className={`${styles.kpiTrend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} /> <span>+24.5% vs mois dernier</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiProfit}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Bénéfice Net (Profit)</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)' }}><Activity size={18} color="#34d399" /></div>
          </div>
          <h3 className={styles.kpiValue}>3,820€</h3>
          <div className={`${styles.kpiTrend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} /> <span>+12.2% vs mois dernier</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCPA}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Coût d'Acquisition (CPA)</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.15)' }}><Target size={18} color="#fbbf24" /></div>
          </div>
          <h3 className={styles.kpiValue}>14.20€</h3>
          <div className={`${styles.kpiTrend} ${styles.trendDown}`}>
            <ArrowDownRight size={14} /> <span>-2.4% (Amélioration)</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiROAS}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>ROAS Global</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(236, 72, 153, 0.15)' }}><TrendingUp size={18} color="#f472b6" /></div>
          </div>
          <h3 className={styles.kpiValue}>3.4x</h3>
          <div className={`${styles.kpiTrend} ${styles.trendNeutral}`}>
            <ChevronRight size={14} /> <span>Stable vs mois dernier</span>
          </div>
        </div>
      </div>

      <div className={`${styles.mainGrid} delay-2`}>
        {/* Main Chart Section */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><BarChart3 size={20} color="#a855f7" /> Évolution des Ventes</h2>
          </div>
          <div className={styles.chartContainer}>
            {chartData.map((data, index) => (
              <div key={index} className={styles.chartColumn}>
                <div className={styles.chartTooltip}>{data.value * 120}€</div>
                <div className={styles.chartBarFill} style={{ height: `${data.value}%`, animationDelay: `${index * 0.05}s` }}></div>
                <span className={styles.chartLabel}>{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel Section */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Activity size={20} color="#34d399" /> Funnel de Conversion</h2>
          </div>
          <div className={styles.funnelContainer}>
            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '100%' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon}><Eye size={16} color="#818cf8" /></div>
                <div><div className={styles.funnelName}>Vues (Ads)</div><div className={styles.funnelRate}>100%</div></div>
              </div>
              <span className={styles.funnelValue}>45.2K</span>
            </div>
            
            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '42%' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon}><MousePointerClick size={16} color="#34d399" /></div>
                <div><div className={styles.funnelName}>Clics (Trafic)</div><div className={styles.funnelRate}>CTR: 2.1%</div></div>
              </div>
              <span className={styles.funnelValue}>9,492</span>
            </div>

            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '15%' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon}><ShoppingCart size={16} color="#fbbf24" /></div>
                <div><div className={styles.funnelName}>Ajouts Panier</div><div className={styles.funnelRate}>ATC: 4.5%</div></div>
              </div>
              <span className={styles.funnelValue}>427</span>
            </div>

            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '8%', background: 'rgba(16, 185, 129, 0.3)' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon} style={{ background: 'rgba(16, 185, 129, 0.2)' }}><CreditCard size={16} color="#10b981" /></div>
                <div><div className={styles.funnelName}>Achats</div><div className={styles.funnelRate}>Conv: 2.8%</div></div>
              </div>
              <span className={styles.funnelValue}>265</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className={`${styles.sectionBox} delay-3`}>
        <div className={styles.sectionHeader} style={{ marginBottom: 0 }}>
          <h2 className={styles.sectionTitle}><Package size={20} color="#f472b6" /> Top Produits Performants</h2>
          <a href="#" style={{ fontSize: '13px', color: '#a855f7', textDecoration: 'none' }}>Voir tout</a>
        </div>
        <div className={styles.topProductsGrid}>
          {topProducts.map((prod) => (
            <div key={prod.id} className={styles.productRow}>
              <img src={prod.img} alt={prod.title} className={styles.productImg} />
              <div className={styles.productInfo}>
                <div className={styles.productTitle}>{prod.title}</div>
                <div className={styles.productMetrics}>
                  <div className={styles.productMetricItem}><Package size={12} /> {prod.sales} ventes</div>
                  <div className={styles.productMetricItem}><Activity size={12} /> Conv: {prod.conv}</div>
                </div>
              </div>
              <div className={styles.productRevenue}>{prod.revenue}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
