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
  Send
} from "lucide-react";

export default function CodOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const res = await fetch("/api/orders/cod");
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(false);
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
    } catch (e) {
      console.error("Status update error:", e);
      fetchOrders();
    }
  };

  const handleCreateTestOrder = async () => {
    try {
      const demoNames = ["Awa Sow", "Ibrahima Fall", "Fatou Kiné Diop", "Modou Lo"];
      const demoCities = ["Dakar Centre (Plateau, Médina)", "Thiès / Mbour / Saly", "Dakar Banlieue (Keur Massar)", "Touba"];
      const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
      const randomCity = demoCities[Math.floor(Math.random() * demoCities.length)];
      const randomPhone = `+221 77 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`;

      await fetch("/api/orders/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: randomName,
          customerPhone: randomPhone,
          customerCity: randomCity,
          customerAddress: "Quartier Résidentiel, Rue Principale",
          paymentMethod: Math.random() > 0.5 ? "Espèces à la livraison" : "Wave / Orange Money",
          productTitle: "Déshumidificateur Électrique Portatif",
          bundleTitle: "Pack 2 Achetés (-15%)",
          quantity: 2,
          unitPrice: 15000,
          totalPrice: 25500,
          currency: "XOF"
        })
      });
      fetchOrders();
    } catch (e) {
      alert("Erreur lors de la création du test");
    }
  };

  const formatPrice = (p) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 })
      .format(p)
      .replace("XOF", "FCFA");
  };

  // Stats calculation
  const totalRevenue = orders
    .filter(o => o.status !== "ANNULE")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
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
      (o.productTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>
            Commandes COD (Sénégal)
            <span className={styles.flagBadge}>🇸🇳 EasySell DropX</span>
          </h1>
          <p className={styles.subtitle}>
            Gérez vos commandes avec paiement à la livraison (Cash & Wave/Orange Money). Contactez vos clients sur WhatsApp en 1 clic.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            className={styles.actionButton} 
            onClick={fetchOrders}
            title="Rafraîchir la liste"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button 
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={handleCreateTestOrder}
          >
            <Plus size={16} />
            Créer Commande Test
          </button>
        </div>
      </header>

      {/* KPI METRICS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Chiffre d&apos;Affaires COD</span>
            <span className={styles.statValue}>{formatPrice(totalRevenue)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(234, 179, 8, 0.15)", color: "#facc15" }}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Nouvelles / À Confirmer</span>
            <span className={styles.statValue}>{newOrdersCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
            <Truck size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>En Cours de Livraison</span>
            <span className={styles.statValue}>{inDeliveryCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(37, 211, 102, 0.15)", color: "#25D366" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Livrées & Encaissées</span>
            <span className={styles.statValue}>{deliveredCount}</span>
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
            placeholder="Rechercher par nom, tel, ville..." 
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
            <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "8px" }}>Aucune commande trouvée</h3>
            <p style={{ fontSize: "14px", color: "#71717a", maxWidth: "420px", margin: "0 auto 20px" }}>
              Dès qu&apos;un client remplit votre formulaire EasySell sur Shopify ou en preview, sa commande apparaîtra ici avec son numéro WhatsApp direct.
            </p>
            <button 
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={handleCreateTestOrder}
            >
              <Plus size={16} /> Générer une commande de test
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
                <th>Montant & Règlement</th>
                <th>Statut</th>
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

                    {/* MONTANT */}
                    <td>
                      <div className={styles.amount}>{formatPrice(order.totalPrice)}</div>
                      <span className={styles.paymentTag}>{order.paymentMethod}</span>
                    </td>

                    {/* STATUT */}
                    <td>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}
                      >
                        <option value="NOUVEAU">🟡 Nouveau</option>
                        <option value="CONFIRME">📞 Confirmé</option>
                        <option value="EN_LIVRAISON">🛵 En Livraison</option>
                        <option value="LIVRE">🟢 Livré & Encaissé</option>
                        <option value="ANNULE">🔴 Annulé</option>
                      </select>
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
