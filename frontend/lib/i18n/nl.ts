import type { Dict } from "./fr";

export const nl: Dict = {
  nav: {
    home: "Home",
    releases: "Releases",
    dubpacks: "Dubpacks",
    shop: "Shop",
    rankings: "Charts",
    pricing: "Tarieven",
    login: "Inloggen",
    register: "Registreren"
  },
  home: {
    overline: "Onafhankelijk muziekplatform",
    headline: "Publiceer, verkoop en\nlaat je muziek stralen",
    sub: "Sauroraa Records ondersteunt onafhankelijke artiesten met krachtige tools, transparante inkomstenDeling en een betrokken gemeenschap.",
    cta_explore: "Releases verkennen",
    cta_listen: "Nu luisteren",
    latest_releases: "Laatste releases",
    view_all: "Alles bekijken →",
    featured_artists: "Uitgelichte artiesten",
    how_title: "Hoe het werkt",
    how_steps: [
      { title: "Uploaden", desc: "Zet je tracks, dubpacks en covers in enkele klikken online." },
      { title: "Ontdekking", desc: "Kom in de kijker op de homepage, charts en afspeellijsten." },
      { title: "Inkomsten", desc: "Houd tot 70% van elke verkoop. Gegarandeerde maandelijkse uitbetaling." }
    ],
    charts_title: "Trending nu",
    charts_sub: "Maandelijkse ranking op basis van views, shares & downloads",
    charts_cta: "Bekijk de volledige ranking →",
    pricing_title: "Plannen voor elke artiest",
    pricing_cta: "Vergelijk alle plannen →",
    join_title: "Word lid van Sauroraa Records",
    join_sub: "Duizenden artiesten vertrouwen ons platform al.",
    join_cta: "Gratis account aanmaken"
  },
  pricing: {
    title: "Plannen & Tarieven",
    sub: "Start gratis, upgrade wanneer je er klaar voor bent.",
    toggle_artist: "Artiest",
    toggle_agency: "Bureau",
    popular: "Populair",
    per_month: "/mnd",
    free: "Gratis",
    select: "Kiezen",
    subscribe: "Abonneren",
    features_title: "Functievergelijking",
    faq_title: "Veelgestelde vragen",
    plans: {
      artist_free: { name: "Artist Free", commission: "70/30", releases: "3 releases/maand", support: "Standaard support", analytics: false, branding: false },
      artist_basic: { name: "Artist Basic", commission: "80/20", releases: "Onbeperkte releases", support: "Prioritaire support", analytics: true, branding: false },
      artist_pro: { name: "Artist Pro", commission: "90/10", releases: "Onbeperkte releases", support: "Toegewijde support", analytics: true, branding: true },
      agency_start: { name: "Agency Start", commission: "80/20", artists: "Tot 5 artiesten", support: "Prioritaire support" },
      agency_pro: { name: "Agency Pro", commission: "90/10", artists: "Onbeperkte artiesten", support: "Toegewijde support" }
    },
    faq: [
      { q: "Wanneer word ik betaald?", a: "De inkomsten worden berekend op de 1e van elke maand. De overschrijving vindt plaats binnen 5 werkdagen." },
      { q: "Kan ik van plan wisselen?", a: "Ja, je kunt je plan op elk moment upgraden of downgraden. De wijziging is onmiddellijk van kracht." },
      { q: "Hoe werkt de commissie?", a: "De commissie wordt toegepast op elke verkoop. Voorbeeld: voor een release van €5 op het Pro-plan (90/10) ontvang je €4,50." },
      { q: "Is er een verbintenis?", a: "Nee, alle plannen zijn zonder verbintenis. Je kunt op elk moment opzeggen vanuit je dashboard." }
    ],
    features: {
      releases: "Releases",
      commission: "Artiestencommissie",
      analytics: "Geavanceerde analyses",
      branding: "Aangepaste branding",
      support: "Support"
    }
  },
  shop: {
    title: "Shop",
    sub: "Koop releases & dubpacks veilig via Stripe",
    filter_all: "Alles",
    filter_releases: "Releases",
    filter_dubpacks: "Dubpacks",
    sort_latest: "Nieuwste",
    sort_price_asc: "Prijs: laag naar hoog",
    sort_price_desc: "Prijs: hoog naar laag",
    buy: "Kopen",
    add_cart: "Toevoegen",
    empty: "Nog geen artikelen beschikbaar.",
    badge_release: "RELEASE",
    badge_dubpack: "DUBPACK"
  },
  rankings: {
    title: "Charts",
    sub_prefix: "Top artiesten op views, shares & downloads —",
    podium_revenue: "Score",
    podium_downloads: "Downloads",
    empty: "Geen rankingdata beschikbaar voor deze maand.",
    rank: "Rang"
  },
  common: {
    loading: "Laden...",
    error: "Er is een fout opgetreden.",
    free: "Gratis",
    paid: "Betaald",
    follow: "Volgen",
    unfollow: "Ontvolgen",
    followers: "volgers"
  }
};
