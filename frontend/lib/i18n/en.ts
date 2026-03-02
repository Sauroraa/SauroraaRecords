import type { Dict } from "./fr";

export const en: Dict = {
  nav: {
    home: "Home",
    releases: "Releases",
    dubpacks: "Dubpacks",
    shop: "Shop",
    rankings: "Charts",
    pricing: "Pricing",
    login: "Login",
    register: "Register"
  },
  home: {
    overline: "Independent music platform",
    headline: "Publish, sell and\nlet your music shine",
    sub: "Sauroraa Records empowers independent artists with powerful tools, transparent revenue sharing and an engaged community.",
    cta_explore: "Explore releases",
    cta_listen: "Listen now",
    latest_releases: "Latest releases",
    view_all: "View all →",
    featured_artists: "Featured artists",
    how_title: "How it works",
    how_steps: [
      { title: "Upload", desc: "Drop your tracks, dubpacks and covers in a few clicks." },
      { title: "Discovery", desc: "Get featured on the homepage, charts and playlists." },
      { title: "Revenue", desc: "Earn up to 30% of every sale. Guaranteed monthly payout." }
    ],
    charts_title: "Trending now",
    charts_sub: "Monthly ranking by revenue & downloads",
    charts_cta: "See the full ranking →",
    pricing_title: "Plans tailored for every artist",
    pricing_cta: "Compare all plans →",
    join_title: "Join Sauroraa Records",
    join_sub: "Thousands of artists already trust our platform.",
    join_cta: "Create a free account"
  },
  pricing: {
    title: "Plans & Pricing",
    sub: "Start for free, upgrade when you're ready.",
    toggle_artist: "Artist",
    toggle_agency: "Agency",
    popular: "Popular",
    per_month: "/mo",
    free: "Free",
    select: "Select",
    subscribe: "Subscribe",
    features_title: "Feature comparison",
    faq_title: "Frequently asked questions",
    plans: {
      artist_free: { name: "Artist Free", commission: "10/90", releases: "3 releases/month", support: "Standard support", analytics: false, branding: false },
      artist_basic: { name: "Artist Basic", commission: "20/80", releases: "Unlimited releases", support: "Priority support", analytics: true, branding: false },
      artist_pro: { name: "Artist Pro", commission: "30/70", releases: "Unlimited releases", support: "Dedicated support", analytics: true, branding: true },
      agency_start: { name: "Agency Start", commission: "80/20", artists: "Up to 5 artists", support: "Priority support" },
      agency_pro: { name: "Agency Pro", commission: "90/10", artists: "Unlimited artists", support: "Dedicated support" }
    },
    faq: [
      { q: "When do I get paid?", a: "Revenue is calculated on the 1st of each month. The transfer is made within 5 business days." },
      { q: "Can I change my plan?", a: "Yes, you can upgrade or downgrade your plan at any time. The change takes effect immediately." },
      { q: "How does the commission work?", a: "The commission applies to each sale. Example: for a release at €5 on the Pro plan (90/10), you receive €4.50." },
      { q: "Is there a commitment?", a: "No, all plans are commitment-free. You can cancel at any time from your dashboard." }
    ],
    features: {
      releases: "Releases",
      commission: "Artist commission",
      analytics: "Advanced analytics",
      branding: "Custom branding",
      support: "Support"
    }
  },
  shop: {
    title: "Shop",
    sub: "Buy releases & dubpacks securely via Stripe",
    filter_all: "All",
    filter_releases: "Releases",
    filter_dubpacks: "Dubpacks",
    sort_latest: "Latest",
    sort_price_asc: "Price: low to high",
    sort_price_desc: "Price: high to low",
    buy: "Buy",
    add_cart: "Add",
    empty: "No items available yet.",
    badge_release: "RELEASE",
    badge_dubpack: "DUBPACK"
  },
  rankings: {
    title: "Charts",
    sub_prefix: "Top artists by revenue & downloads —",
    podium_revenue: "Revenue",
    podium_downloads: "Downloads",
    empty: "Rankings will appear at the end of each month.",
    rank: "Rank"
  },
  common: {
    loading: "Loading...",
    error: "An error occurred.",
    free: "Free",
    paid: "Paid",
    follow: "Follow",
    unfollow: "Unfollow",
    followers: "followers"
  }
};
