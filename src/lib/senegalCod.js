/**
 * Senegal Cash-On-Delivery (COD) & Financial Management Helper
 * Calculates Revenue, Alibaba/AliExpress Supplier Cost, Delivery Fee by Zone, and Wave Fees.
 */

export const SENEGAL_DELIVERY_ZONES = [
  { id: 'dakar_centre', label: 'Dakar Centre (Plateau, Médina, Fann, Point E)', fee: 1500, delay: '24h' },
  { id: 'dakar_ouest', label: 'Dakar Ouest (Almadies, Ngor, Ouakam, Mermoz)', fee: 2000, delay: '24h' },
  { id: 'dakar_nord', label: 'Dakar Nord (Yoff, Ouest-Foire, Nord-Foire, Maristes)', fee: 2000, delay: '24h' },
  { id: 'dakar_banlieue', label: 'Dakar Banlieue (Pikine, Guédiawaye, Parcelles Assainies)', fee: 2500, delay: '24h' },
  { id: 'rufisque', label: 'Rufisque / Keur Massar / Diamniadio', fee: 3000, delay: '24h-48h' },
  { id: 'thies_mbour', label: 'Thiès / Mbour / Saly', fee: 3500, delay: '24h-48h' },
  { id: 'touba', label: 'Touba / Mbacké / Diourbel', fee: 4000, delay: '48h' },
  { id: 'saint_louis', label: 'Saint-Louis', fee: 4500, delay: '48h' },
  { id: 'kaolack', label: 'Kaolack', fee: 4500, delay: '48h' },
  { id: 'ziguinchor', label: 'Ziguinchor', fee: 5000, delay: '48h-72h' },
  { id: 'autre', label: 'Autre région du Sénégal', fee: 5000, delay: '48h-72h' },
];

/**
 * Get delivery fee based on city or zone name
 */
export function getDeliveryFeeByZone(city = '') {
  const c = String(city).toLowerCase().trim();
  if (!c) return 2000;

  if (c.includes('centre') || c.includes('plateau') || c.includes('médina') || c.includes('medina') || c.includes('fann') || c.includes('point e')) {
    return 1500;
  }
  if (c.includes('ouest') || c.includes('almadies') || c.includes('ngor') || c.includes('ouakam') || c.includes('mermoz')) {
    return 2000;
  }
  if (c.includes('nord') || c.includes('yoff') || c.includes('foire') || c.includes('maristes')) {
    return 2000;
  }
  if (c.includes('banlieue') || c.includes('pikine') || c.includes('guédiawaye') || c.includes('guediawaye') || c.includes('parcelles')) {
    return 2500;
  }
  if (c.includes('rufisque') || c.includes('keur massar') || c.includes('diamniadio')) {
    return 3000;
  }
  if (c.includes('thiès') || c.includes('thies') || c.includes('mbour') || c.includes('saly')) {
    return 3500;
  }
  if (c.includes('touba') || c.includes('mbacké') || c.includes('mbacke') || c.includes('diourbel')) {
    return 4000;
  }
  if (c.includes('saint-louis') || c.includes('saint louis') || c.includes('ndar')) {
    return 4500;
  }
  if (c.includes('kaolack')) {
    return 4500;
  }
  if (c.includes('ziguinchor') || c.includes('casamance')) {
    return 5000;
  }
  return 3000;
}

/**
 * Standard Wave Fee in Senegal is 1%
 */
export function getWaveFee(totalAmount = 0) {
  return Math.round(Number(totalAmount || 0) * 0.01);
}

/**
 * Normalize prices into FCFA
 * If price was sent in USD/EUR (e.g. 76.99), converts using standard 1 USD = ~600 FCFA rate
 */
export function normalizePriceFCFA(rawPrice, currency = 'XOF') {
  const p = Number(rawPrice) || 0;
  if (p <= 0) return 0;

  const curr = String(currency || '').toUpperCase();
  if (curr === 'USD' || curr === 'EUR' || p < 500) {
    return Math.round((p * 600) / 100) * 100;
  }
  return Math.round(p);
}

/**
 * Format FCFA price nicely for display
 */
export function formatFCFA(amount = 0) {
  const num = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(num) + ' FCFA';
}

/**
 * Complete order financial breakdown
 * Chiffre d'Affaires - Coût Fournisseur (Alibaba/AliExpress) - Frais Livraison (par zone) - Frais Wave (1%) = Bénéfice Net
 */
export function calculateOrderFinances(order, customSupplierCost = null) {
  const rawRevenue = normalizePriceFCFA(order.totalPrice, order.currency);
  const deliveryFee = order.deliveryFee ? Number(order.deliveryFee) : getDeliveryFeeByZone(order.customerCity || order.deliveryZone);
  
  // Wave fee is 1%
  const waveFee = order.waveFee !== undefined ? Number(order.waveFee) : getWaveFee(rawRevenue);

  // Supplier cost: if custom cost provided, use it; else if stored in order; else estimate benchmark (~28% of selling price)
  let supplierCost = 0;
  if (customSupplierCost !== null && !isNaN(Number(customSupplierCost))) {
    supplierCost = Number(customSupplierCost);
  } else if (order.supplierCost || order.supplierPrice) {
    supplierCost = normalizePriceFCFA(order.supplierCost || order.supplierPrice, order.supplierCurrency || 'XOF');
  } else {
    // Standard benchmark for dropshipping AliExpress/Alibaba product cost: ~28% of retail price
    supplierCost = Math.round((rawRevenue * 0.28) / 100) * 100;
  }

  // Net Profit
  const netProfit = rawRevenue - supplierCost - deliveryFee - waveFee;
  const marginPct = rawRevenue > 0 ? Math.round((netProfit / rawRevenue) * 100) : 0;

  return {
    revenue: rawRevenue,
    supplierCost,
    deliveryFee,
    waveFee,
    netProfit,
    marginPct,
    zone: order.customerCity || order.deliveryZone || 'Sénégal'
  };
}
