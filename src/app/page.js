"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  DollarSign, TrendingUp, Package, Activity, BarChart3, Zap,
  Target, ArrowUpRight, ArrowDownRight, Eye, MousePointerClick,
  ShoppingCart, CreditCard, PieChart, Users, Globe, Smartphone,
  Monitor, Tablet, Clock, RefreshCw, AlertTriangle, Mail,
  Star, Heart, MessageCircle, Share2, ThumbsUp, Truck,
  BarChart2, Hash, Flame
} from 'lucide-react';
import styles from './Dashboard.module.css';

/* ===========================================
   DONNÉES D'ANALYTICS (simulées depuis la DB)
   =========================================== */

const kpis = [
  { label: 'Chiffre d\'Affaires', value: '€24,830', change: '+18.2%', up: true, color: '#a78bfa',
    spark: [30,45,38,52,60,55,70,65,80,72,88,95] },
  { label: 'Bénéfice Net', value: '€8,420', change: '+12.5%', up: true, color: '#34d399',
    spark: [20,28,25,35,30,40,38,45,50,48,55,62] },
  { label: 'Commandes', value: '342', change: '+24.1%', up: true, color: '#60a5fa',
    spark: [10,15,12,18,22,20,28,25,32,30,38,42] },
  { label: 'Taux Conversion', value: '3.8%', change: '-0.3%', up: false, color: '#fbbf24',
    spark: [40,42,38,45,43,40,38,42,40,37,35,38] },
  { label: 'Panier Moyen', value: '€72.60', change: '+5.4%', up: true, color: '#f472b6',
    spark: [55,58,60,62,58,65,68,64,70,72,68,73] },
];

const revenueData = [
  { day: 'Lun', rev: 65, ads: 30 },
  { day: 'Mar', rev: 78, ads: 35 },
  { day: 'Mer', rev: 55, ads: 28 },
  { day: 'Jeu', rev: 90, ads: 40 },
  { day: 'Ven', rev: 100, ads: 45 },
  { day: 'Sam', rev: 85, ads: 38 },
  { day: 'Dim', rev: 70, ads: 32 },
  { day: 'Lun', rev: 82, ads: 36 },
  { day: 'Mar', rev: 95, ads: 42 },
  { day: 'Mer', rev: 75, ads: 34 },
  { day: 'Jeu', rev: 88, ads: 39 },
  { day: 'Ven', rev: 98, ads: 44 },
];

const trafficSources = [
  { name: 'Facebook Ads', pct: 42, color: '#3b82f6', val: '18,984' },
  { name: 'TikTok Ads', pct: 28, color: '#ec4899', val: '12,656' },
  { name: 'Google Ads', pct: 15, color: '#10b981', val: '6,780' },
  { name: 'Organique', pct: 10, color: '#f59e0b', val: '4,520' },
  { name: 'Direct', pct: 5, color: '#64748b', val: '2,260' },
];

const deviceData = [
  { name: 'Mobile', pct: 68, color: '#8b5cf6', val: '30,744' },
  { name: 'Desktop', pct: 24, color: '#06b6d4', val: '10,848' },
  { name: 'Tablette', pct: 8, color: '#f59e0b', val: '3,616' },
];

const geoData = [
  { country: 'France', pct: 45, color: '#6366f1' },
  { country: 'Belgique', pct: 18, color: '#a855f7' },
  { country: 'Canada', pct: 15, color: '#ec4899' },
  { country: 'Suisse', pct: 12, color: '#f59e0b' },
  { country: 'Côte d\'Ivoire', pct: 10, color: '#10b981' },
];

const topProducts = [
  { name: 'Humidificateur LED Portable', orders: 87, revenue: '€4,350', conv: '4.2%', status: 'hot' },
  { name: 'Correcteur Posture Magnétique', orders: 64, revenue: '€2,560', conv: '3.8%', status: 'hot' },
  { name: 'Brosse Soufflante 5-en-1', orders: 52, revenue: '€3,640', conv: '2.9%', status: 'warm' },
  { name: 'Lampe Lune 3D', orders: 41, revenue: '€1,640', conv: '2.1%', status: 'warm' },
  { name: 'Organisateur Câbles Magnétique', orders: 38, revenue: '€760', conv: '1.8%', status: 'cold' },
];

const funnelData = [
  { name: 'Impressions Pub', value: '45,200', icon: Eye, pct: 100, color: '#818cf8' },
  { name: 'Clics Trafic', value: '9,492', icon: MousePointerClick, pct: 21, color: '#34d399' },
  { name: 'Ajouts Panier', value: '1,423', icon: ShoppingCart, pct: 3.1, color: '#fbbf24' },
  { name: 'Achats', value: '342', icon: CreditCard, pct: 0.76, color: '#10b981' },
];

const recentActivity = [
  { action: 'Vente confirmée', product: 'Humidificateur LED', amount: '€49.90', time: 'il y a 2 min', status: 'success' },
  { action: 'Nouveau clic pub', product: 'Brosse Soufflante', amount: '€0.42 CPC', time: 'il y a 5 min', status: 'info' },
  { action: 'Abandon panier', product: 'Lampe Lune 3D', amount: '€39.90', time: 'il y a 8 min', status: 'warning' },
  { action: 'Vente confirmée', product: 'Correcteur Posture', amount: '€29.90', time: 'il y a 12 min', status: 'success' },
  { action: 'Remboursement', product: 'Organisateur Câbles', amount: '-€19.90', time: 'il y a 1h', status: 'error' },
];

/* ===========================================
   COMPOSANTS UTILITAIRES
   =========================================== */

function DonutChart({ data, centerValue, centerLabel, size = 160 }) {
  let cumulative = 0;
  const segments = data.map(d => {
    const start = cumulative;
    cumulative += d.pct;
    return `${d.color} ${start}% ${cumulative}%`;
  });
  const gradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className={styles.donutCard}>
      <div className={styles.donut} style={{ width: size, height: size, background: gradient }}>
        <div className={styles.donutCenter} style={{ width: size * 0.62, height: size * 0.62 }}>
          <span className={styles.donutCenterValue}>{centerValue}</span>
          <span className={styles.donutCenterLabel}>{centerLabel}</span>
        </div>
      </div>
      <div className={styles.legend}>
        {data.map((d, i) => (
          <div key={i} className={styles.legendRow}>
            <div className={styles.legendLeft}>
              <div className={styles.legendDot} style={{ background: d.color }}></div>
              {d.name || d.country}
            </div>
            <div className={styles.legendRight}>{d.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ data, color }) {
  const max = Math.max(...data);
  return (
    <div className={styles.miniSparkline}>
      {data.map((v, i) => (
        <div
          key={i}
          className={styles.sparkBar}
          style={{
            height: `${(v / max) * 100}%`,
            background: `linear-gradient(to top, ${color}33, ${color})`,
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
    </div>
  );
}

/* ===========================================
   DASHBOARD PRINCIPAL
   =========================================== */

export default function Dashboard() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState('30j');

  if (!session) {
    // Si pas de session, le layout.js affiche la LandingPage
    return null;
  }

  const firstName = session.user?.name?.split(' ')[0] || 'User';

  return (
    <div className={`${styles.container} animate-fade-in`}>

      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Analytics Dashboard</h1>
          <p>Bienvenue {firstName} — voici un résumé complet de vos performances.</p>
        </div>
        <div className={styles.periodTabs}>
          {['7j', '30j', '90j', '1 an'].map(p => (
            <button
              key={p}
              className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI ROW — 5 cartes */}
      <div className={styles.kpiRow}>
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className={`${styles.kpiCard} ${
              [styles.kpiViolet, styles.kpiGreen, styles.kpiBlue, styles.kpiYellow, styles.kpiPink][i]
            }`}
          >
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span className={`${styles.kpiBadge} ${kpi.up ? styles.badgeUp : styles.badgeDown}`}>
                {kpi.up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                {kpi.change}
              </span>
            </div>
            <MiniSparkline data={kpi.spark} color={kpi.color} />
          </div>
        ))}
      </div>

      {/* MAIN ROW: BAR CHART + FUNNEL */}
      <div className={styles.grid2col}>
        {/* Bar Chart: Revenus vs Dépenses Pub */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><BarChart3 size={18} color="#a78bfa" /> Revenus vs Dépenses Pub</h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(to top, #6366f1, #a855f7)', display: 'inline-block' }}></span> Revenus
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(to top, #ef4444, #f97316)', display: 'inline-block' }}></span> Dépenses
              </span>
            </div>
          </div>
          <div className={styles.barChart}>
            {revenueData.map((d, i) => (
              <div key={i} className={styles.barCol}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${d.rev}%`,
                    background: 'linear-gradient(to top, rgba(99,102,241,0.3), #a855f7)',
                    animationDelay: `${i * 0.06}s`,
                    marginBottom: '2px',
                  }}
                  title={`Revenus: €${d.rev * 25}`}
                />
                <div
                  className={styles.bar}
                  style={{
                    height: `${d.ads}%`,
                    background: 'linear-gradient(to top, rgba(239,68,68,0.3), #f97316)',
                    animationDelay: `${i * 0.06 + 0.3}s`,
                    width: '50%',
                    maxWidth: '18px',
                    position: 'absolute',
                    bottom: '28px',
                    right: '4px',
                  }}
                  title={`Pub: €${d.ads * 12}`}
                />
                <span className={styles.barLabel}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel de Conversion */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Activity size={18} color="#34d399" /> Funnel de Conversion</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {funnelData.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${Math.min(f.pct, 100)}%`,
                    background: `${f.color}15`,
                    borderRadius: '12px 0 0 12px',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={f.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {f.pct >= 1 ? `${f.pct}%` : `${f.pct}%`} du total
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', position: 'relative', zIndex: 1 }}>{f.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: 3 DONUT CHARTS */}
      <div className={styles.grid3col}>
        {/* Sources de Trafic */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Globe size={18} color="#3b82f6" /> Sources de Trafic</h2>
          </div>
          <DonutChart
            data={trafficSources}
            centerValue="45.2K"
            centerLabel="Visites"
          />
        </div>

        {/* Répartition Appareils */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Smartphone size={18} color="#8b5cf6" /> Appareils</h2>
          </div>
          <DonutChart
            data={deviceData}
            centerValue="45.2K"
            centerLabel="Sessions"
          />
        </div>

        {/* Géographie */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Globe size={18} color="#10b981" /> Géographie</h2>
          </div>
          <DonutChart
            data={geoData}
            centerValue="5"
            centerLabel="Pays"
          />
        </div>
      </div>

      {/* ROW 4: TOP PRODUCTS TABLE + RECENT ACTIVITY */}
      <div className={styles.grid2col}>
        {/* Top Produits */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Package size={18} color="#f472b6" /> Top Produits</h2>
          </div>
          <table className={styles.activityTable}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Commandes</th>
                <th>Revenus</th>
                <th>Conv.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{p.name}</td>
                  <td>{p.orders}</td>
                  <td style={{ color: '#34d399', fontWeight: 600 }}>{p.revenue}</td>
                  <td>{p.conv}</td>
                  <td>
                    <span className={styles.statusDot} style={{
                      background: p.status === 'hot' ? '#10b981' : p.status === 'warm' ? '#f59e0b' : '#64748b'
                    }} />
                    {p.status === 'hot' ? '🔥 Hot' : p.status === 'warm' ? '🟡 Warm' : '❄️ Cold'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activité Récente */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Clock size={18} color="#60a5fa" /> Activité en Direct</h2>
            <RefreshCw size={14} color="rgba(255,255,255,0.3)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={styles.statusDot} style={{
                    background: a.status === 'success' ? '#10b981' : a.status === 'info' ? '#3b82f6' : a.status === 'warning' ? '#f59e0b' : '#ef4444'
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{a.action}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{a.product} · {a.time}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: a.status === 'success' ? '#34d399' : a.status === 'error' ? '#f87171' : '#fff'
                }}>{a.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 5: PROGRESS BARS — Objectifs Mensuels */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Target size={18} color="#fbbf24" /> Objectifs Mensuels</h2>
        </div>
        <div className={styles.progressList}>
          {[
            { name: 'Objectif CA (€30,000)', pct: 83, color: '#a855f7' },
            { name: 'Objectif Commandes (500)', pct: 68, color: '#3b82f6' },
            { name: 'Objectif ROAS (4.0x)', pct: 85, color: '#10b981' },
            { name: 'Objectif Visiteurs (60K)', pct: 75, color: '#f59e0b' },
            { name: 'Objectif Taux Conversion (5%)', pct: 76, color: '#ec4899' },
          ].map((obj, i) => (
            <div key={i} className={styles.progressItem}>
              <div className={styles.progressTop}>
                <span className={styles.progressName}>{obj.name}</span>
                <span className={styles.progressPercent}>{obj.pct}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${obj.pct}%`, background: `linear-gradient(90deg, ${obj.color}66, ${obj.color})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======== ROW 6: HEATMAP — Ventes par Heure / Jour ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Flame size={18} color="#f97316" /> Carte de Chaleur — Ventes par Heure</h2>
        </div>
        <div className={styles.heatmapGrid}>
          {/* Header row */}
          <div></div>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className={styles.heatmapHeaderCell}>{h}h</div>
          ))}
          {/* Days */}
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, di) => (
            <>
              <div key={`l-${di}`} className={styles.heatmapLabel}>{day}</div>
              {Array.from({ length: 24 }, (_, hi) => {
                const intensity = Math.sin((hi - 6) * 0.3 + di * 0.5) * 0.5 + 0.5;
                const weekend = di >= 5 ? 1.3 : 1;
                const peak = (hi >= 10 && hi <= 14) || (hi >= 19 && hi <= 22) ? 1.5 : 1;
                const val = Math.min(intensity * weekend * peak, 1);
                const alpha = (val * 0.85 + 0.05).toFixed(2);
                return (
                  <div
                    key={`c-${di}-${hi}`}
                    className={styles.heatmapCell}
                    style={{ background: `rgba(139, 92, 246, ${alpha})` }}
                    title={`${day} ${hi}h — ${Math.round(val * 12)} ventes`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* ======== ROW 7: AD PERFORMANCE — Performances Publicitaires ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><BarChart2 size={18} color="#3b82f6" /> Performances Publicitaires</h2>
        </div>
        <div className={styles.adGrid}>
          {[
            { platform: 'Facebook Ads', icon: '📘', status: 'Actif', statusColor: '#10b981', spend: '€2,340', impressions: '128K', clicks: '4,820', ctr: '3.76%', cpc: '€0.49', conv: '186', roas: '4.2x' },
            { platform: 'TikTok Ads', icon: '🎵', status: 'Actif', statusColor: '#10b981', spend: '€1,870', impressions: '245K', clicks: '8,120', ctr: '3.31%', cpc: '€0.23', conv: '112', roas: '3.1x' },
            { platform: 'Google Ads', icon: '🔍', status: 'En pause', statusColor: '#f59e0b', spend: '€980', impressions: '52K', clicks: '2,340', ctr: '4.50%', cpc: '€0.42', conv: '44', roas: '2.8x' },
          ].map((ad, i) => (
            <div key={i} className={styles.adCard}>
              <div className={styles.adCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={styles.adPlatformIcon} style={{ background: 'rgba(255,255,255,0.05)' }}>{ad.icon}</div>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{ad.platform}</span>
                </div>
                <span className={styles.adStatusBadge} style={{ background: `${ad.statusColor}20`, color: ad.statusColor }}>{ad.status}</span>
              </div>
              <div className={styles.adMetricRow}><span>Dépensé</span><span className={styles.adMetricValue}>{ad.spend}</span></div>
              <div className={styles.adMetricRow}><span>Impressions</span><span className={styles.adMetricValue}>{ad.impressions}</span></div>
              <div className={styles.adMetricRow}><span>Clics</span><span className={styles.adMetricValue}>{ad.clicks}</span></div>
              <div className={styles.adMetricRow}><span>CTR</span><span className={styles.adMetricValue}>{ad.ctr}</span></div>
              <div className={styles.adMetricRow}><span>CPC Moyen</span><span className={styles.adMetricValue}>{ad.cpc}</span></div>
              <div className={styles.adMetricRow}><span>Conversions</span><span className={styles.adMetricValue}>{ad.conv}</span></div>
              <div className={styles.adMetricRow} style={{ borderBottom: 'none' }}><span>ROAS</span><span className={styles.adMetricValue} style={{ color: '#34d399' }}>{ad.roas}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ======== ROW 8: CUSTOMER INSIGHTS ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Users size={18} color="#ec4899" /> Insights Clients</h2>
        </div>
        <div className={styles.customerGrid}>
          {[
            { val: '1,842', label: 'Clients Totaux', color: '#a855f7' },
            { val: '€67.40', label: 'Valeur Client Moy. (LTV)', color: '#10b981' },
            { val: '23%', label: 'Taux de Retour Client', color: '#3b82f6' },
            { val: '4.6 / 5', label: 'Note Moyenne Avis', color: '#fbbf24' },
          ].map((m, i) => (
            <div key={i} className={styles.customerMetric}>
              <div className={styles.customerMetricValue} style={{ color: m.color }}>{m.val}</div>
              <div className={styles.customerMetricLabel}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ======== ROW 9: HEALTH SCORES (Gauges) + STOCK ALERTS ======== */}
      <div className={styles.grid2even}>
        {/* Health Scores */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Activity size={18} color="#10b981" /> Scores de Santé</h2>
          </div>
          <div className={styles.gaugeContainer}>
            {[
              { label: 'Score Boutique', val: 92, color: '#10b981' },
              { label: 'Santé Pub', val: 78, color: '#3b82f6' },
              { label: 'Satisfaction', val: 88, color: '#a855f7' },
              { label: 'Livraison', val: 71, color: '#f59e0b' },
            ].map((g, i) => (
              <div key={i} className={styles.gaugeItem}>
                <div className={styles.gauge} style={{
                  background: `conic-gradient(${g.color} 0% ${g.val}%, rgba(255,255,255,0.06) ${g.val}% 100%)`
                }}>
                  <div className={styles.gaugeInner}>{g.val}</div>
                </div>
                <span className={styles.gaugeLabel}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><AlertTriangle size={18} color="#ef4444" /> Alertes Stock</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Humidificateur LED', stock: 3, status: 'critique', color: '#ef4444' },
              { name: 'Correcteur Posture', stock: 12, status: 'faible', color: '#f59e0b' },
              { name: 'Brosse Soufflante', stock: 48, status: 'ok', color: '#10b981' },
              { name: 'Lampe Lune 3D', stock: 7, status: 'faible', color: '#f59e0b' },
              { name: 'Organisateur Câbles', stock: 85, status: 'ok', color: '#10b981' },
            ].map((s, i) => (
              <div key={i} className={styles.stockItem}>
                <div className={styles.stockInfo}>
                  <div className={styles.stockIcon} style={{ background: `${s.color}15` }}>
                    <Package size={14} color={s.color} />
                  </div>
                  <div>
                    <div className={styles.stockName}>{s.name}</div>
                    <div className={styles.stockSub}>{s.stock} unités restantes</div>
                  </div>
                </div>
                <span className={styles.stockBadge} style={{ background: `${s.color}20`, color: s.color }}>
                  {s.status === 'critique' ? '⚠️ Critique' : s.status === 'faible' ? '🟡 Faible' : '✅ OK'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======== ROW 10: EMAIL MARKETING ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Mail size={18} color="#06b6d4" /> Email Marketing</h2>
        </div>
        <div className={styles.emailGrid}>
          {[
            { val: '8,420', label: 'Abonnés Liste', color: '#06b6d4' },
            { val: '42.3%', label: 'Taux d\'Ouverture', color: '#10b981' },
            { val: '6.8%', label: 'Taux de Clic', color: '#a855f7' },
            { val: '€3,240', label: 'Revenus Email', color: '#f59e0b' },
            { val: '1.2%', label: 'Taux Désabonnement', color: '#ef4444' },
            { val: '12', label: 'Campagnes Envoyées', color: '#3b82f6' },
          ].map((e, i) => (
            <div key={i} className={styles.emailMetric}>
              <div className={styles.emailMetricValue} style={{ color: e.color }}>{e.val}</div>
              <div className={styles.emailMetricLabel}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ======== ROW 11: SOCIAL MEDIA ENGAGEMENT ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Heart size={18} color="#ec4899" /> Engagement Réseaux Sociaux</h2>
        </div>
        <div className={styles.grid2even}>
          {/* Social Metrics Donut */}
          <DonutChart
            data={[
              { name: 'Instagram', pct: 38, color: '#e1306c' },
              { name: 'TikTok', pct: 32, color: '#ff0050' },
              { name: 'Facebook', pct: 18, color: '#1877f2' },
              { name: 'Twitter/X', pct: 12, color: '#64748b' },
            ]}
            centerValue="52.4K"
            centerLabel="Followers"
          />
          {/* Social KPIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
            {[
              { icon: Heart, label: 'Likes ce mois', val: '12,340', color: '#ec4899' },
              { icon: MessageCircle, label: 'Commentaires', val: '2,180', color: '#3b82f6' },
              { icon: Share2, label: 'Partages', val: '890', color: '#10b981' },
              { icon: Eye, label: 'Portée organique', val: '185K', color: '#a855f7' },
              { icon: ThumbsUp, label: 'Taux Engagement', val: '5.2%', color: '#f59e0b' },
              { icon: Hash, label: 'Mentions', val: '342', color: '#06b6d4' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={s.color} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{s.val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======== ROW 12: SHIPPING & FULFILLMENT ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Truck size={18} color="#f59e0b" /> Expéditions & Fulfillment</h2>
        </div>
        <div className={styles.customerGrid}>
          {[
            { val: '342', label: 'Commandes ce mois', color: '#a855f7' },
            { val: '298', label: 'Expédiées', color: '#10b981' },
            { val: '31', label: 'En cours', color: '#3b82f6' },
            { val: '13', label: 'En attente', color: '#f59e0b' },
          ].map((m, i) => (
            <div key={i} className={styles.customerMetric}>
              <div className={styles.customerMetricValue} style={{ color: m.color }}>{m.val}</div>
              <div className={styles.customerMetricLabel}>{m.label}</div>
            </div>
          ))}
        </div>
        <div className={styles.progressList} style={{ marginTop: '20px' }}>
          {[
            { name: 'Taux d\'expédition à temps', pct: 94, color: '#10b981' },
            { name: 'Livraisons réussies', pct: 97, color: '#3b82f6' },
            { name: 'Colis retournés', pct: 3, color: '#ef4444' },
          ].map((obj, i) => (
            <div key={i} className={styles.progressItem}>
              <div className={styles.progressTop}>
                <span className={styles.progressName}>{obj.name}</span>
                <span className={styles.progressPercent}>{obj.pct}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${obj.pct}%`, background: `linear-gradient(90deg, ${obj.color}66, ${obj.color})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======== ROW 13: COMPETITOR PRICE WATCH ======== */}
      <div className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Eye size={18} color="#6366f1" /> Veille Concurrentielle Prix</h2>
        </div>
        <table className={styles.activityTable}>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Votre Prix</th>
              <th>Prix Concurrent Min</th>
              <th>Prix Concurrent Max</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Humidificateur LED', your: '€49.90', min: '€42.00', max: '€65.00', pos: '2ème' },
              { name: 'Correcteur Posture', your: '€29.90', min: '€24.90', max: '€39.90', pos: '3ème' },
              { name: 'Brosse Soufflante', your: '€69.90', min: '€59.00', max: '€89.00', pos: '1er 🏆' },
              { name: 'Lampe Lune 3D', your: '€39.90', min: '€35.00', max: '€55.00', pos: '2ème' },
            ].map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#fff' }}>{c.name}</td>
                <td style={{ color: '#a855f7', fontWeight: 600 }}>{c.your}</td>
                <td>{c.min}</td>
                <td>{c.max}</td>
                <td style={{ fontWeight: 600 }}>{c.pos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

