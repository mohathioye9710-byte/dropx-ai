import { DollarSign, TrendingUp, Package, Activity, Clock, BarChart3, ChevronRight, Zap, Target, Filter, ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, ShoppingCart, CreditCard, PieChart } from 'lucide-react';
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

  // Vraies données de la base de données
  const activities = await prisma.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  const analyzedProductsCount = activities.length;

  // Comme nous n'avons pas encore d'intégration avec les vraies boutiques (Shopify) ni les Ads,
  // nous affichons les vraies valeurs disponibles (qui sont à 0 pour les ventes).
  const totalRevenue = 0;
  const netProfit = 0;
  const cpa = 0;
  const roas = 0;

  // Données vides pour les graphiques puisqu'il n'y a pas de ventes
  const chartData = [
    { day: '01', value: 0 }, { day: '04', value: 0 }, { day: '07', value: 0 },
    { day: '10', value: 0 }, { day: '13', value: 0 }, { day: '16', value: 0 },
    { day: '19', value: 0 }, { day: '22', value: 0 }, { day: '25', value: 0 },
    { day: '28', value: 0 }
  ];

  const topProducts = [];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      
      {/* Banner Analyser Produit */}
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

      {/* KPI Cards avec de vraies données (0 pour l'instant) */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiRevenue}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Chiffre d'Affaires</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.15)' }}><DollarSign size={18} color="#818cf8" /></div>
          </div>
          <h3 className={styles.kpiValue}>{totalRevenue}€</h3>
          <div className={`${styles.kpiTrend} ${styles.trendNeutral}`}>
             <span>Connectez une boutique Shopify</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiProfit}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Produits Analysés</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)' }}><Package size={18} color="#34d399" /></div>
          </div>
          <h3 className={styles.kpiValue}>{analyzedProductsCount}</h3>
          <div className={`${styles.kpiTrend} ${analyzedProductsCount > 0 ? styles.trendUp : styles.trendNeutral}`}>
             <span>Produits passés dans l'IA</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCPA}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Coût d'Acquisition (CPA)</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.15)' }}><Target size={18} color="#fbbf24" /></div>
          </div>
          <h3 className={styles.kpiValue}>{cpa}€</h3>
          <div className={`${styles.kpiTrend} ${styles.trendNeutral}`}>
             <span>Connectez votre Business Manager</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiROAS}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>ROAS Global</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(236, 72, 153, 0.15)' }}><TrendingUp size={18} color="#f472b6" /></div>
          </div>
          <h3 className={styles.kpiValue}>{roas}x</h3>
          <div className={`${styles.kpiTrend} ${styles.trendNeutral}`}>
             <span>En attente de données</span>
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
                <div className={styles.chartBarFill} style={{ height: `${data.value || 1}%`, animationDelay: `${index * 0.05}s`, opacity: data.value === 0 ? 0.2 : 1 }}></div>
                <span className={styles.chartLabel}>{data.day}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '8px' }}>
            Aucune vente enregistrée pour cette période.
          </div>
        </div>

        {/* Funnel Section */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Activity size={20} color="#34d399" /> Funnel de Conversion</h2>
          </div>
          <div className={styles.funnelContainer}>
            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '0%' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon}><Eye size={16} color="#818cf8" /></div>
                <div><div className={styles.funnelName}>Vues (Ads)</div><div className={styles.funnelRate}>--</div></div>
              </div>
              <span className={styles.funnelValue}>0</span>
            </div>
            
            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '0%' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon}><MousePointerClick size={16} color="#34d399" /></div>
                <div><div className={styles.funnelName}>Clics (Trafic)</div><div className={styles.funnelRate}>CTR: 0%</div></div>
              </div>
              <span className={styles.funnelValue}>0</span>
            </div>

            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '0%' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon}><ShoppingCart size={16} color="#fbbf24" /></div>
                <div><div className={styles.funnelName}>Ajouts Panier</div><div className={styles.funnelRate}>ATC: 0%</div></div>
              </div>
              <span className={styles.funnelValue}>0</span>
            </div>

            <div className={styles.funnelStep}>
              <div className={styles.funnelBg} style={{ width: '0%', background: 'rgba(16, 185, 129, 0.3)' }}></div>
              <div className={styles.funnelInfo}>
                <div className={styles.funnelIcon} style={{ background: 'rgba(16, 185, 129, 0.2)' }}><CreditCard size={16} color="#10b981" /></div>
                <div><div className={styles.funnelName}>Achats</div><div className={styles.funnelRate}>Conv: 0%</div></div>
              </div>
              <span className={styles.funnelValue}>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Donut Charts Section */}
      <div className={`${styles.donutGrid} delay-3`}>
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><PieChart size={20} color="#fbbf24" /> Sources de Trafic</h2>
          </div>
          <div className={styles.donutContainer}>
            {/* Empty state donut since there is no data */}
            <div className={styles.donutWrapper} style={{ background: 'conic-gradient(rgba(255,255,255,0.05) 0% 100%)' }}>
              <div className={styles.donutHole}>
                <span className={styles.donutTotal}>0</span>
                <span className={styles.donutLabelInner}>Visites</span>
              </div>
            </div>
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendName}><div className={styles.legendDot} style={{ background: '#3b82f6' }}></div>Facebook Ads</div>
                <div className={styles.legendValue}>0%</div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendName}><div className={styles.legendDot} style={{ background: '#ec4899' }}></div>TikTok Ads</div>
                <div className={styles.legendValue}>0%</div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendName}><div className={styles.legendDot} style={{ background: '#10b981' }}></div>Google Ads</div>
                <div className={styles.legendValue}>0%</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><PieChart size={20} color="#6366f1" /> Répartition Appareils</h2>
          </div>
          <div className={styles.donutContainer}>
            {/* Empty state donut */}
            <div className={styles.donutWrapper} style={{ background: 'conic-gradient(rgba(255,255,255,0.05) 0% 100%)' }}>
              <div className={styles.donutHole}>
                <span className={styles.donutTotal}>0</span>
                <span className={styles.donutLabelInner}>Sessions</span>
              </div>
            </div>
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendName}><div className={styles.legendDot} style={{ background: '#8b5cf6' }}></div>Mobile</div>
                <div className={styles.legendValue}>0%</div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendName}><div className={styles.legendDot} style={{ background: '#f59e0b' }}></div>Desktop</div>
                <div className={styles.legendValue}>0%</div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendName}><div className={styles.legendDot} style={{ background: '#64748b' }}></div>Tablette</div>
                <div className={styles.legendValue}>0%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className={`${styles.sectionBox} delay-4`} style={{ marginTop: '24px' }}>
        <div className={styles.sectionHeader} style={{ marginBottom: 0 }}>
          <h2 className={styles.sectionTitle}><Package size={20} color="#f472b6" /> Top Produits Performants</h2>
          <a href="#" style={{ fontSize: '13px', color: '#a855f7', textDecoration: 'none' }}>Voir tout</a>
        </div>
        <div className={styles.topProductsGrid}>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              Aucun produit vendu. Connectez votre boutique pour voir vos meilleures ventes ici.
            </div>
          ) : (
            topProducts.map((prod) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
