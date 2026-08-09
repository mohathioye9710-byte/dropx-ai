"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  DollarSign, TrendingUp, Package, Activity, BarChart3, Zap,
  Target, ArrowUpRight, ArrowDownRight, Eye, MousePointerClick,
  ShoppingCart, CreditCard, PieChart, Users, Globe, Smartphone,
  Monitor, Tablet, Clock, RefreshCw
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
    </div>
  );
}
