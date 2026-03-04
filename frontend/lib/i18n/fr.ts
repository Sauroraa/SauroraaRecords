export const fr = {
  nav: {
    home: "Accueil",
    releases: "Releases",
    dubpacks: "Dubpacks",
    shop: "Shop",
    rankings: "Charts",
    pricing: "Tarifs",
    login: "Connexion",
    register: "S'inscrire"
  },
  home: {
    overline: "Plateforme musicale indépendante",
    headline: "Publie, vends et\nfais rayonner ta musique",
    sub: "Sauroraa Records propulse les artistes indépendants avec des outils puissants, un partage de revenus transparent et une communauté engagée.",
    cta_explore: "Explorer les releases",
    cta_listen: "Écouter maintenant",
    latest_releases: "Dernières releases",
    view_all: "Voir tout →",
    featured_artists: "Artistes en vedette",
    how_title: "Comment ça marche",
    how_steps: [
      { title: "Upload", desc: "Dépose tes tracks, dubpacks et covers en quelques clics." },
      { title: "Découverte", desc: "Sois mis en avant sur la homepage, les charts et les playlists." },
      { title: "Revenus", desc: "Garde jusqu'à 70% de chaque vente. Paiement mensuel garanti." }
    ],
    charts_title: "Top du moment",
    charts_sub: "Classement mensuel par revenus & downloads",
    charts_cta: "Voir le classement complet →",
    pricing_title: "Des plans adaptés à chaque artiste",
    pricing_cta: "Comparer tous les plans →",
    join_title: "Rejoins Sauroraa Records",
    join_sub: "Des milliers d'artistes font déjà confiance à notre plateforme.",
    join_cta: "Créer un compte gratuit"
  },
  pricing: {
    title: "Plans & Tarifs",
    sub: "Commence gratuitement, monte en gamme quand tu es prêt.",
    toggle_artist: "Artiste",
    toggle_agency: "Agence",
    popular: "Populaire",
    per_month: "/mois",
    free: "Gratuit",
    select: "Choisir",
    subscribe: "S'abonner",
    features_title: "Comparatif des fonctionnalités",
    faq_title: "Questions fréquentes",
    plans: {
      artist_free: { name: "Artist Free", commission: "10/90", releases: "3 releases/mois", support: "Support standard", analytics: false, branding: false },
      artist_basic: { name: "Artist Basic", commission: "20/80", releases: "Releases illimitées", support: "Support prioritaire", analytics: true, branding: false },
      artist_pro: { name: "Artist Pro", commission: "30/70", releases: "Releases illimitées", support: "Support dédié", analytics: true, branding: true },
      agency_start: { name: "Agency Start", commission: "80/20", artists: "Jusqu'à 5 artistes", support: "Support prioritaire" },
      agency_pro: { name: "Agency Pro", commission: "90/10", artists: "Artistes illimités", support: "Support dédié" }
    },
    faq: [
      { q: "Quand suis-je payé ?", a: "Les revenus sont calculés le 1er de chaque mois. Le virement est effectué dans les 5 jours ouvrables suivants." },
      { q: "Puis-je changer de plan ?", a: "Oui, tu peux upgrader ou downgrader ton plan à tout moment. Le changement est effectif immédiatement." },
      { q: "Comment fonctionne la commission ?", a: "La commission s'applique sur chaque vente. Exemple : pour une release à 5€ en plan Pro (90/10), tu reçois 4,50€." },
      { q: "Y a-t-il un engagement ?", a: "Non, tous les plans sont sans engagement. Tu peux résilier à tout moment depuis ton dashboard." }
    ],
    features: {
      releases: "Releases",
      commission: "Commission artiste",
      analytics: "Analytics avancées",
      branding: "Branding personnalisé",
      support: "Support"
    }
  },
  shop: {
    title: "Shop",
    sub: "Achète releases & dubpacks en toute sécurité via Stripe",
    filter_all: "Tout",
    filter_releases: "Releases",
    filter_dubpacks: "Dubpacks",
    sort_latest: "Plus récents",
    sort_price_asc: "Prix croissant",
    sort_price_desc: "Prix décroissant",
    buy: "Acheter",
    add_cart: "Ajouter",
    empty: "Aucun article disponible pour le moment.",
    badge_release: "RELEASE",
    badge_dubpack: "DUBPACK"
  },
  rankings: {
    title: "Charts",
    sub_prefix: "Top artistes par revenus & downloads —",
    podium_revenue: "Revenus",
    podium_downloads: "Downloads",
    empty: "Aucune donnée de classement pour ce mois.",
    rank: "Rang"
  },
  common: {
    loading: "Chargement...",
    error: "Une erreur est survenue.",
    free: "Gratuit",
    paid: "Payant",
    follow: "Suivre",
    unfollow: "Ne plus suivre",
    followers: "abonnés"
  }
};

export type Dict = typeof fr;
