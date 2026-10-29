const fallbackItems = [
  { icon: '✓', title: 'Simple au quotidien', text: 'Une solution pensée pour s’intégrer facilement à votre routine.' },
  { icon: '✓', title: 'Conçu pour durer', text: 'Des matériaux et une conception adaptés à une utilisation régulière.' },
  { icon: '✓', title: 'Pratique et efficace', text: 'Profitez pleinement du produit, sans étapes inutiles.' },
];

export function createLandingPageFallback(productTitle = 'Ce produit') {
  return {
    section1_benefits: {
      sectionTitle: `Pourquoi choisir ${productTitle} ?`,
      items: fallbackItems.map(({ title, text }) => ({ title, text })),
    },
    section2_features: { items: fallbackItems },
    section3_steps: {
      sectionTitle: 'Prêt en quelques étapes',
      items: [
        { title: 'Préparez le produit', text: 'Suivez les indications fournies avec votre commande.' },
        { title: 'Utilisez-le simplement', text: 'Intégrez-le à votre routine selon vos besoins.' },
        { title: 'Profitez du résultat', text: 'Une solution pratique, conçue pour vous accompagner au quotidien.' },
      ],
    },
    section4_cta: {
      title: 'Faites-vous plaisir dès aujourd’hui',
      text: 'Choisissez l’offre qui vous convient et commandez en toute simplicité.',
      buttonText: 'Ajouter au panier',
    },
    section5_power: {
      sectionTitle: 'Les points essentiels',
      items: fallbackItems,
      buttonText: 'Je choisis mon offre',
      ratingText: 'Paiement sécurisé',
    },
    // Real reviews returned by the analysis stay intact; no customer feedback is invented.
    reviews: [],
    faq: [
      { question: 'Comment utiliser le produit ?', answer: 'Les instructions d’utilisation sont fournies avec votre commande.' },
      { question: 'Quand ma commande sera-t-elle expédiée ?', answer: 'Votre commande est préparée dès sa validation. Les délais exacts sont indiqués au moment du paiement.' },
      { question: 'Puis-je suivre ma commande ?', answer: 'Oui, les informations de suivi sont envoyées dès que votre colis est pris en charge.' },
      { question: 'Quels sont les moyens de paiement acceptés ?', answer: 'Vous pouvez régler votre commande avec les moyens de paiement proposés de façon sécurisée au moment du paiement.' },
      { question: 'Comment contacter le support ?', answer: 'Notre équipe reste disponible pour vous aider si vous avez une question avant ou après votre commande.' },
    ],
  };
}

export function normalizeLandingPage(landingPage, productTitle) {
  const fallback = createLandingPageFallback(productTitle);
  const source = landingPage && typeof landingPage === 'object' ? landingPage : {};
  const section = (key) => ({
    ...fallback[key],
    ...(source[key] && typeof source[key] === 'object' ? source[key] : {}),
    items: Array.isArray(source[key]?.items) && source[key].items.length > 0
      ? source[key].items
      : fallback[key].items,
  });

  return {
    ...fallback,
    ...source,
    section1_benefits: section('section1_benefits'),
    section2_features: section('section2_features'),
    section3_steps: section('section3_steps'),
    section4_cta: { ...fallback.section4_cta, ...(source.section4_cta || {}) },
    section5_power: section('section5_power'),
    reviews: Array.isArray(source.reviews) ? source.reviews : fallback.reviews,
    faq: Array.isArray(source.faq) && source.faq.length > 0 ? source.faq : fallback.faq,
  };
}
