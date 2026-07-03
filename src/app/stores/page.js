"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import styles from './page.module.css';
import { Store, Plus, ExternalLink, Settings, Activity, ShoppingBag, TrendingUp, Loader2, Sparkles, Package, Image as ImageIcon } from 'lucide-react';

export default function StoresPage() {
  const { data: session } = useSession();
  const [connectedStores, setConnectedStores] = useState([]);
  const [generatedStores, setGeneratedStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setConnectedStores(data.connectedStores || []);
          setGeneratedStores(data.generatedStores || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExportHistory = async (store) => {
    if (!store.metadata) {
      alert("Erreur : Impossible de trouver les données de cette boutique (ancienne génération sans métadonnées).");
      return;
    }

    try {
      alert("Lancement de l'exportation vers Shopify en arrière-plan. Merci de patienter...");
      
      const res = await fetch('/api/shopify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: store.metadata,
          currency: 'EUR'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'exportation");
      
      alert(`Succès ! Le produit a été exporté vers Shopify.\nLien : ${data.shopifyProduct?.admin_graphql_api_id || 'Voir sur Shopify'}`);
    } catch (err) {
      alert(`Erreur lors de l'export : ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes Boutiques</h1>
          <p className={styles.subtitle}>Gérez vos boutiques connectées et vos créations IA.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/analyzer" className={styles.secondaryButton}>
            <Sparkles size={16} />
            Générer avec l'IA
          </Link>
          <Link href="/shopify" className={styles.addButton}>
            <Plus size={16} />
            Connecter une boutique
          </Link>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: '#818cf8' }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* ====== Connected Stores ====== */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Boutiques Connectées</h2>
            {connectedStores.length > 0 ? (
              <div className={styles.storeGrid}>
                {connectedStores.map((store) => (
                  <div key={store.id} className={styles.storeCard}>
                    <div className={styles.storeCardContent}>
                      <div className={styles.storeHeader}>
                        <div className={styles.storeInfo}>
                          <div className={styles.storeIconWrapper}>
                            <ShoppingBag size={22} className={styles.storeIcon} />
                          </div>
                          <div>
                            <h3 className={styles.storeName} style={{textTransform: 'capitalize'}}>{store.name}</h3>
                            <div className={styles.storeUrl}>
                              <a href={`https://${store.url}`} target="_blank" rel="noopener noreferrer">{store.url} <ExternalLink size={11} /></a>
                            </div>
                          </div>
                        </div>
                        <div className={styles.storeStatus}>
                          <span className={styles.statusDot}></span>
                          {store.status}
                        </div>
                      </div>
                      
                      <div className={styles.storeMetrics}>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Revenus</span>
                          <span className={styles.metricValue}>{store.revenue} <TrendingUp size={14} className={styles.trendIcon} /></span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Commandes</span>
                          <span className={styles.metricValue}>{store.orders}</span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Plateforme</span>
                          <span className={styles.metricValue}>{store.platform}</span>
                        </div>
                      </div>

                      <div className={styles.storeActions}>
                        <Link href={`/analyzer`} className={styles.actionBtn}>
                          <Activity size={14} /> Analyser
                        </Link>
                        <Link href="/shopify" className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
                          <Settings size={14} /> Configurer
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <Store size={36} className={styles.emptyIcon} />
                </div>
                <h3 className={styles.emptyTitle}>Aucune boutique connectée</h3>
                <p className={styles.emptyDesc}>Connectez votre première boutique Shopify pour commencer à utiliser DropX AI.</p>
              </div>
            )}
          </div>

          {/* ====== Generated Stores ====== */}
          <div className={styles.section} style={{ marginTop: '48px' }}>
            <h2 className={styles.sectionTitle}>Boutiques Générées par l'IA</h2>
            {generatedStores.length > 0 ? (
              <div className={styles.storeGrid}>
                {generatedStores.map((store, index) => {
                  const hasImage = store.metadata && store.metadata.image;
                  
                  return (
                    <div key={store.id} className={styles.storeCard} style={{ animationDelay: `${index * 0.08}s` }}>
                      {/* Product Image Cover */}
                      {hasImage ? (
                        <div className={styles.storeCardImage}>
                          <img 
                            src={store.metadata.image} 
                            alt={store.name}
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className={styles.storeCardImageFallback}>
                          <Package size={48} className={styles.fallbackIcon} />
                        </div>
                      )}

                      {/* Card Content */}
                      <div className={styles.storeCardContent}>
                        <div className={styles.storeHeader}>
                          <div className={styles.storeInfo}>
                            <div className={styles.generatedIconWrapper}>
                              <Sparkles size={20} className={styles.generatedIcon} />
                            </div>
                            <div style={{minWidth: 0}}>
                              <h3 className={styles.storeName}>{store.name}</h3>
                              <div className={styles.storeUrl}>
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>{store.niche}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.storeStatus} style={
                            store.metadata 
                              ? {} 
                              : { background: 'rgba(234, 179, 8, 0.08)', color: '#fbbf24', borderColor: 'rgba(234, 179, 8, 0.15)' }
                          }>
                            <span className={styles.statusDot} style={
                              store.metadata 
                                ? {} 
                                : { background: '#fbbf24', boxShadow: '0 0 8px rgba(234, 179, 8, 0.6)' }
                            }></span>
                            {store.metadata ? 'Sauvegardé' : 'Ancien'}
                          </div>
                        </div>
                        
                        <div className={styles.storeMetrics}>
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Créée le</span>
                            <span className={styles.metricValue}>{store.createdAt}</span>
                          </div>
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Produits</span>
                            <span className={styles.metricValue}>{store.products}</span>
                          </div>
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Type</span>
                            <span className={styles.metricValue}>IA</span>
                          </div>
                        </div>

                        <div className={styles.storeActions}>
                          <Link href={`/analyzer?id=${store.id}`} className={styles.actionBtn}>
                            <Activity size={14} /> Éditer
                          </Link>
                          <button onClick={() => handleExportHistory(store)} className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
                            <ExternalLink size={14} /> Exporter
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <Sparkles size={36} className={styles.emptyIcon} />
                </div>
                <h3 className={styles.emptyTitle}>Aucune boutique générée</h3>
                <p className={styles.emptyDesc}>Laissez notre IA construire une boutique de dropshipping complète pour vous.</p>
                <Link href="/analyzer" className={styles.primaryButton}>
                  Commencer maintenant
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
