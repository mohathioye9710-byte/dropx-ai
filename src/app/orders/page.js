"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { 
  ShoppingBag, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Search, 
  Clock, 
  XCircle, 
  PackageCheck,
  Send,
  TrendingUp,
  Edit2,
  Check,
  X,
  Trash2
} from "lucide-react";
import { formatFCFA } from "@/lib/senegalCod";

export default function CodOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [shopDomain, setShopDomain] = useState(null);
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingSupplierCostId, setEditingSupplierCostId] = useState(null);
  const [tempSupplierCost, setTempSupplierCost] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const fetchOrders = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const res = await fetch("/api/orders/cod");
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        if (data.shopDomain) setShopDomain(data.shopDomain);
        if (data.finances) setFinances(data.finances);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
    // Auto-refresh every 10 seconds to catch incoming COD orders in real-time
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      await fetch("/api/orders/cod", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      fetchOrders();
    } catch (e) {
      console.error("Status update error:", e);
      fetchOrders();
    }
  };

  const handleSaveSupplierCost = async (orderId) => {
    const cost = Number(tempSupplierCost);
    if (isNaN(cost) || cost < 0) {
      alert("Veuillez saisir un coût fournisseur valide en FCFA");
      return;
    }
    try {
      await fetch("/api/orders/cod", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, supplierCost: cost })
      });
      setEditingSupplierCostId(null);
      fetchOrders();
    } catch (e) {
      console.error("Supplier cost update error:", e);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    const label = orderNumber || orderId;
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement la commande ${label} ?\nElle sera également supprimée de votre boutique Shopify.`)) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      await fetch("/api/orders/cod", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      fetchOrders(false);
    } catch (err) {
      console.error("Delete order error:", err);
      fetchOrders(false);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleWipeAllOrders = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer TOUTES les commandes ?\nCette action est irréversible et supprimera également les commandes sur Shopify.")) {
      return;
    }

    setLoading(true);
    try {
      setOrders([]);
      await fetch("/api/orders/cod", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ALL" })
      });
      fetchOrders(false);
    } catch (e) {
      console.error("Wipe all orders error:", e);
      fetchOrders(false);
    }
  };

  const newOrdersCount = orders.filter(o => o.status === "NOUVEAU").length;
  const inDeliveryCount = orders.filter(o => o.status === "EN_LIVRAISON").length;
  const deliveredCount = orders.filter(o => o.status === "LIVRE").length;

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === "ALL" || o.status === filter;
    const matchesSearch = 
      (o.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerPhone || "").includes(searchQuery) ||
      (o.customerCity || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.deliveryZone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.productTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>
            Commandes Réelles (Boutique & COD)
            {shopDomain ? (
              <a 
                href={`https://${shopDomain}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.flagBadge}
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                title="Ouvrir votre boutique Shopify ShopX"
              >
                🛍️ {shopDomain.includes('98fny6') ? 'sen-shopx.myshopify.com' : shopDomain}
              </a>
            ) : (
              <a 
                href="https://sen-shopx.myshopify.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.flagBadge}
                style={{ textDecoration: 'none' }}
              >
                🛍️ sen-shopx.myshopify.com
              </a>
            )}
          </h1>
          <p className={styles.subtitle}>
            Calcul transparent en temps réel : Chiffre d&apos;Affaires (Site) - Coût Fournisseur (Alibaba/AliExpress) - Frais de Livraison (Zone Sénégal) - Frais Wave (1%) = Bénéfice Net Réel.
          </p>
        </div>

        <div className={styles.headerActions}>
          {orders.length > 0 && (
            <button 
              className={`${styles.actionButton} ${styles.dangerButton}`}
              onClick={handleWipeAllOrders}
              title="Supprimer toutes les commandes"
            >
              <Trash2 size={16} />
              Vider tout
            </button>
          )}
          <button 
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={() => fetchOrders(true)}
            title="Synchroniser avec votre boutique Shopify"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Synchroniser Shopify
          </button>
        </div>
      </header>

      {/* KPI METRICS — FORMULE ENCAISSEMENTS COD SÉNÉGAL */}
      <div className={styles.statsGrid}>
        {/* 1. Chiffre d'Affaires Brut */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Chiffre d&apos;Affaires (Site)</span>
            <span className={styles.statValue}>{formatFCFA(finances?.totalRevenue || 0)}</span>
            <span className={styles.statSub}>Total ventes clients ({orders.filter(o => o.status !== "ANNULE").length} cmd)</span>
          </div>
        </div>

        {/* 2. Bénéfice Net Réel */}
        <div className={styles.statCard} style={{ borderColor: "rgba(16, 185, 129, 0.4)", background: "rgba(16, 185, 129, 0.05)" }}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.25)", color: "#10b981" }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className={styles.statLabel}>Bénéfice Net Réel</span>
              <span className={styles.statBadge}>{finances?.averageMarginPct || 0}% marge</span>
            </div>
            <span className={styles.statValue} style={{ color: "#34d399" }}>{formatFCFA(finances?.totalNetProfit || 0)}</span>
            <span className={styles.statSub}>Après Alibaba, Transport & Wave</span>
          </div>
        </div>

        {/* 3. Coût Fournisseur Alibaba */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
            <ShoppingBag size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Coût Fournisseur Alibaba</span>
            <span className={styles.statValue}>{formatFCFA(finances?.totalSupplierCost || 0)}</span>
            <span className={styles.statSub}>Achats produits AliExpress / Alibaba</span>
          </div>
        </div>

        {/* 4. Livraison par Zone & Wave */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
            <Truck size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Frais Livraison & Wave</span>
            <span className={styles.statValue}>{formatFCFA((finances?.totalDeliveryFees || 0) + (finances?.totalWaveFees || 0))}</span>
            <span className={styles.statSub}>Livraison: {formatFCFA(finances?.totalDeliveryFees || 0)} | Wave: {formatFCFA(finances?.totalWaveFees || 0)}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.tab} ${filter === "ALL" ? styles.active : ""}`}
            onClick={() => setFilter("ALL")}
          >
            Toutes ({orders.length})
          </button>
          <button 
            className={`${styles.tab} ${filter === "NOUVEAU" ? styles.active : ""}`}
            onClick={() => setFilter("NOUVEAU")}
          >
            🟡 Nouvelles ({newOrdersCount})
          </button>
          <button 
            className={`${styles.tab} ${filter === "CONFIRME" ? styles.active : ""}`}
            onClick={() => setFilter("CONFIRME")}
          >
            📞 Confirmées ({orders.filter(o => o.status === "CONFIRME").length})
          </button>
          <button 
            className={`${styles.tab} ${filter === "EN_LIVRAISON" ? styles.active : ""}`}
            onClick={() => setFilter("EN_LIVRAISON")}
          >
            🛵 En Livraison ({inDeliveryCount})
          </button>
          <button 
            className={`${styles.tab} ${filter === "LIVRE" ? styles.active : ""}`}
            onClick={() => setFilter("LIVRE")}
          >
            🟢 Livrées ({deliveredCount})
          </button>
          <button 
            className={`${styles.tab} ${filter === "ANNULE" ? styles.active : ""}`}
            onClick={() => setFilter("ANNULE")}
          >
            🔴 Annulées ({orders.filter(o => o.status === "ANNULE").length})
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} color="#71717a" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, tel, ville, région..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a1a1aa" }}>
            Chargement des commandes COD...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <PackageCheck className={styles.emptyIcon} />
            <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "8px" }}>Aucune commande pour le moment</h3>
            <p style={{ fontSize: "14px", color: "#71717a", maxWidth: "460px", margin: "0 auto 20px" }}>
              {shopDomain 
                ? `Votre boutique (${shopDomain}) est connectée. Dès qu'un client passe commande sur votre boutique ou via le bouton EasySell, elle s'affichera ici avec le calcul automatique.` 
                : "Vos commandes réelles apparaîtront ici automatiquement dès qu'un client passe commande."}
            </p>
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={() => fetchOrders(true)}
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              Synchroniser les commandes
            </button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Réf</th>
                <th>Client & Contact</th>
                <th>Destination (Sénégal)</th>
                <th>Produit & Offre</th>
                <th>Décomposition Financière (CA, Alibaba, Zone, Wave)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const cleanPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");
                const waMessage = encodeURIComponent(
                  `Bonjour ${order.customerName} ! Je vous contacte depuis la boutique concernant votre commande de : ${order.productTitle} (${order.bundleTitle || '1 Unité'}). Le livreur peut-il passer aujourd'hui à votre adresse : ${order.customerAddress}, ${order.customerCity} ?`
                );
                const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;

                return (
                  <tr key={order.id}>
                    {/* DATE & REF */}
                    <td>
                      <div style={{ fontWeight: 700, color: "#fff" }}>
                        {order.shopifyOrderNumber || order.id.slice(0, 12)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* CLIENT & ACTIONS */}
                    <td>
                      <div className={styles.customerName}>{order.customerName}</div>
                      <div className={styles.customerContact}>
                        <span>{order.customerPhone}</span>
                        <a 
                          href={waUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`${styles.contactBtn} ${styles.whatsappBtn}`}
                          title="Envoyer un message WhatsApp pré-rempli"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                        <a 
                          href={`tel:${order.customerPhone}`} 
                          className={`${styles.contactBtn} ${styles.callBtn}`}
                          title="Appeler le client"
                        >
                          <Phone size={14} /> Appeler
                        </a>
                      </div>
                    </td>

                    {/* DESTINATION */}
                    <td>
                      <div className={styles.locationText}>{order.customerCity}</div>
                      <div className={styles.addressSubtext}>{order.customerAddress}</div>
                    </td>

                    {/* PRODUIT & PACK */}
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{order.productTitle}</div>
                      <div style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "2px" }}>
                        {order.bundleTitle} (Qté: {order.quantity})
                      </div>
                    </td>

                    {/* DÉCOMPOSITION FINANCIÈRE COMPLÈTE */}
                    <td>
                      <div className={styles.financeBox}>
                        {/* 1. Vente Client (Chiffre d'Affaires Brut) */}
                        <div className={`${styles.financeRow} ${styles.financeRowCA}`}>
                          <span>Vente Site (CA) :</span>
                          <span>{formatFCFA(order.normalizedRevenue || order.totalPrice)}</span>
                        </div>

                        {/* 2. Coût Fournisseur Alibaba/AliExpress */}
                        <div className={styles.financeRow}>
                          <span>
                            Fournisseur Alibaba :
                            {editingSupplierCostId !== order.id && (
                              <button 
                                className={styles.alibabaEditBtn}
                                onClick={() => {
                                  setEditingSupplierCostId(order.id);
                                  setTempSupplierCost(String(order.supplierCost || ''));
                                }}
                                title="Modifier le prix d'achat réel sur Alibaba ou AliExpress"
                              >
                                ✏️ Prix
                              </button>
                            )}
                          </span>

                          {editingSupplierCostId === order.id ? (
                            <div className={styles.alibabaInputWrap}>
                              <input 
                                type="number"
                                value={tempSupplierCost}
                                onChange={(e) => setTempSupplierCost(e.target.value)}
                                className={styles.alibabaInput}
                                placeholder="FCFA"
                                autoFocus
                              />
                              <button 
                                className={styles.alibabaSaveBtn}
                                onClick={() => handleSaveSupplierCost(order.id)}
                                title="Sauvegarder"
                              >
                                ✓
                              </button>
                              <button 
                                className={styles.alibabaCancelBtn}
                                onClick={() => setEditingSupplierCostId(null)}
                                title="Annuler"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#f87171" }}>- {formatFCFA(order.supplierCost || 0)}</span>
                          )}
                        </div>

                        {/* 3. Livraison selon Zone Sénégal */}
                        <div className={styles.financeRow}>
                          <span title={order.deliveryZone || order.customerCity}>
                            Livraison ({order.deliveryZone ? (order.deliveryZone.length > 16 ? order.deliveryZone.slice(0, 16) + '...' : order.deliveryZone) : 'Zone'}) :
                          </span>
                          <span style={{ color: "#f87171" }}>- {formatFCFA(order.deliveryFee || 0)}</span>
                        </div>

                        {/* 4. Frais Wave 1% */}
                        <div className={styles.financeRow}>
                          <span>Frais Wave (1%) :</span>
                          <span style={{ color: "#f87171" }}>- {formatFCFA(order.waveFee || 0)}</span>
                        </div>

                        {/* 5. Bénéfice Net Réel */}
                        <div className={styles.financeNet}>
                          <span>Bénéfice Net :</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>+ {formatFCFA(order.netProfit || 0)}</span>
                            <span className={styles.marginPill}>{order.marginPct || 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "4px" }}>
                        <span className={styles.paymentTag}>{order.paymentMethod}</span>
                      </div>
                    </td>

                    {/* STATUT */}
                    <td>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}
                      >
                        <option value="NOUVEAU">🟡 Nouvelle</option>
                        <option value="NON_CONFIRME">🟠 Non Confirmé</option>
                        <option value="CONFIRME">📞 Confirmé</option>
                        <option value="EN_LIVRAISON">🛵 En Livraison</option>
                        <option value="LIVRE">🟢 Livré & Encaissé</option>
                        <option value="ANNULE">🔴 Annulé</option>
                      </select>
                    </td>

                    {/* ACTIONS (WHATSAPP & SUPPRIMER) */}
                    <td>
                      <div className={styles.actionsCell}>
                        {cleanPhone && (
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.waBtn} 
                            title="Contacter le client sur WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteOrder(order.id, order.shopifyOrderNumber)}
                          disabled={deletingOrderId === order.id}
                          title="Supprimer définitivement la commande"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

