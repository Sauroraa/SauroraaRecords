"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";

type Tag = "feat" | "fix" | "perf" | "security" | "design";

type Entry = {
  text: { fr: string; en: string; nl: string };
  tag: Tag;
};

type PatchVersion = {
  version: string;
  date: string;
  entries: Entry[];
};

const CHANGELOG: PatchVersion[] = [
  {
    version: "1.9.0",
    date: "2026-03-10",
    entries: [
      { tag: "feat", text: { fr: "Homepage: nouvelle section 'Chez SauroraaAgency' au-dessus du trending avec artistes et sorties de l'agence mises en avant", en: "Homepage: new 'Chez SauroraaAgency' section above trending with agency artists and releases highlighted first", nl: "Homepage: nieuwe sectie 'Chez SauroraaAgency' boven trending met artiesten en releases van het bureau eerst uitgelicht" } },
      { tag: "feat", text: { fr: "Internationalisation publique renforcée: FR / EN / NL sur header, footer, recherche, auth, commentaires, panier, profils artistes, releases et dubpacks", en: "Expanded public internationalization: FR / EN / NL across header, footer, search, auth, comments, cart, artist profiles, releases and dubpacks", nl: "Uitgebreide publieke internationalisering: FR / EN / NL in header, footer, zoeken, auth, reacties, winkelwagen, artiestprofielen, releases en dubpacks" } },
      { tag: "feat", text: { fr: "Popup de choix de langue au premier accès sur la home avec mémorisation locale et switch desktop/mobile", en: "Language chooser popup on first home visit with local persistence and desktop/mobile switcher", nl: "Taalkeuze-popup bij eerste bezoek aan de home met lokale opslag en desktop/mobile schakelaar" } },
      { tag: "fix", text: { fr: "FollowButton: état d'abonnement fiable via JWT optionnel sur l'endpoint public", en: "FollowButton: reliable follow state via optional JWT on the public endpoint", nl: "FollowButton: betrouwbare volgstatus via optionele JWT op het publieke endpoint" } },
      { tag: "design", text: { fr: "Responsive pass mobile: section agency, hero, pages release/dubpack, profil artiste et modale langue rendus plus propres sur téléphone", en: "Responsive mobile pass: agency section, hero, release/dubpack pages, artist profile and language modal cleaned up for phones", nl: "Responsieve mobiele update: agency-sectie, hero, release/dubpack-pagina's, artiestprofiel en taalmodal opgeschoond voor telefoons" } },
    ]
  },
  {
    version: "1.8.0",
    date: "2026-03-09",
    entries: [
      { tag: "feat", text: { fr: "Dropdown utilisateur dans le header (Profil, Dashboard, Charts, Abonnement, Paramètres, Déconnexion)", en: "User dropdown in header (Profile, Dashboard, Charts, Subscription, Settings, Logout)", nl: "Gebruikersmenu in de header (Profiel, Dashboard, Charts, Abonnement, Instellingen, Afmelden)" } },
      { tag: "feat", text: { fr: "Visibilité des releases : Public, Non répertorié, Privé — sélectionnable à l'upload et modifiable ensuite", en: "Release visibility: Public, Unlisted, Private — selectable at upload and editable later", nl: "Zichtbaarheid van releases: Openbaar, Niet vermeld, Privé — instelbaar bij upload en later aanpasbaar" } },
      { tag: "feat", text: { fr: "Édition inline des releases dans 'Mes Releases' (titre, description, genre, BPM, tonalité, visibilité)", en: "Inline editing of releases in 'My Releases' (title, description, genre, BPM, key, visibility)", nl: "Inline bewerking van releases in 'Mijn Releases' (titel, beschrijving, genre, BPM, toonsoort, zichtbaarheid)" } },
      { tag: "feat", text: { fr: "Liens privés : sélecteur de durée (1j / 2j / 3j / 5j / 7j / 2 semaines / 1 mois / Permanent)", en: "Private links: duration selector (1d / 2d / 3d / 5d / 7d / 2 weeks / 1 month / Permanent)", nl: "Privélinks: duurkiezer (1d / 2d / 3d / 5d / 7d / 2 weken / 1 maand / Permanent)" } },
      { tag: "fix", text: { fr: "Pause/Resume : la lecture reprend exactement à la position pausée (comparaison par releaseId, pas par URL audio)", en: "Pause/Resume: playback resumes at the exact paused position (comparison by releaseId, not audio URL)", nl: "Pauze/Hervatten: afspelen hervat op de exacte gepauzeerde positie (vergelijking op releaseId, niet audio-URL)" } },
      { tag: "fix", text: { fr: "Recherche : correction erreur 500 (champ 'slug' inexistant sur le modèle Artist)", en: "Search: fixed 500 error (non-existent 'slug' field on Artist model)", nl: "Zoeken: 500-fout opgelost (niet-bestaand veld 'slug' op Artist-model)" } },
      { tag: "feat", text: { fr: "Profil artiste : cover thumbnail visible sur chaque track de la liste", en: "Artist profile: cover thumbnail visible on each track in the list", nl: "Artiestprofiel: coverminiatuur zichtbaar op elk nummer in de lijst" } },
    ]
  },
  {
    version: "1.7.0",
    date: "2026-03-09",
    entries: [
      { tag: "feat", text: { fr: "Dashboard artiste : onglets Engage et Broadcasts supprimés", en: "Artist dashboard: Engage and Broadcasts tabs removed", nl: "Artiestdashboard: tabbladen Engage en Broadcasts verwijderd" } },
      { tag: "feat", text: { fr: "Analytics recharts : courbes AreaChart (streams/downloads), BarChart (followers), KPI row, Top 10 tracks avec covers", en: "Analytics recharts: AreaChart curves (streams/downloads), BarChart (followers), KPI row, Top 10 tracks with covers", nl: "Analytics recharts: AreaChart-lijnen (streams/downloads), BarChart (volgers), KPI-rij, Top 10 nummers met covers" } },
      { tag: "feat", text: { fr: "GET /releases/mine : endpoint JWT pour afficher uniquement les releases de l'artiste connecté", en: "GET /releases/mine: JWT endpoint to show only the logged-in artist's releases", nl: "GET /releases/mine: JWT-eindpunt om alleen de releases van de ingelogde artiest te tonen" } },
      { tag: "fix", text: { fr: "Upload form : champ 'Preview duration' masqué pour les releases FREE", en: "Upload form: 'Preview duration' field hidden for FREE releases", nl: "Uploadformulier: veld 'Preview duration' verborgen voor GRATIS releases" } },
      { tag: "fix", text: { fr: "Pages légales : URLs et emails mis à jour de sauroraa.be vers sauroraarecords.be", en: "Legal pages: URLs and emails updated from sauroraa.be to sauroraarecords.be", nl: "Juridische pagina's: URL's en e-mails bijgewerkt van sauroraa.be naar sauroraarecords.be" } },
    ]
  },
  {
    version: "1.6.0",
    date: "2026-03-09",
    entries: [
      { tag: "feat", text: { fr: "Rankings : score backend renvoyé correctement (n'était plus inclus dans la réponse), totalViews = streams uniquement", en: "Rankings: backend score now correctly returned (was missing from response), totalViews = streams only", nl: "Ranglijsten: backend-score nu correct teruggegeven (ontbrak in respons), totalViews = alleen streams" } },
      { tag: "fix", text: { fr: "Rankings : filtrage des faux artistes (nécessite un displayName + au moins 1 release publiée)", en: "Rankings: filtering of fake artists (requires a displayName + at least 1 published release)", nl: "Ranglijsten: filtering van nepartiesten (vereist een displayName + minimaal 1 gepubliceerde release)" } },
      { tag: "feat", text: { fr: "Rankings : 15 artistes par défaut, bouton 'Show more' (+15) et 'Top 100'", en: "Rankings: 15 artists by default, 'Show more' button (+15) and 'Top 100'", nl: "Ranglijsten: standaard 15 artiesten, knop 'Meer tonen' (+15) en 'Top 100'" } },
      { tag: "feat", text: { fr: "Barre de recherche dans le header avec dropdown (artistes + releases, debounce 280ms)", en: "Search bar in header with dropdown (artists + releases, 280ms debounce)", nl: "Zoekbalk in de header met dropdown (artiesten + releases, 280ms debounce)" } },
    ]
  },
  {
    version: "1.5.0",
    date: "2026-03-08",
    entries: [
      { tag: "feat", text: { fr: "Queue système : Prev/Next/Shuffle/Repeat dans le GlobalPlayer, auto-avance à la fin d'un son", en: "Queue system: Prev/Next/Shuffle/Repeat in GlobalPlayer, auto-advance at end of track", nl: "Wachtrijsysteem: Vorige/Volgende/Willekeurig/Herhalen in GlobalPlayer, automatisch doorgaan aan het einde" } },
      { tag: "feat", text: { fr: "TrackDetailPanel : panneau slide-over style SoundCloud (waveform, like, repost, share, report, download/buy, commentaires, carte artiste)", en: "TrackDetailPanel: SoundCloud-style slide-over panel (waveform, like, repost, share, report, download/buy, comments, artist card)", nl: "TrackDetailPanel: SoundCloud-stijl uitschuifpaneel (waveform, like, repost, delen, rapporteren, download/kopen, reacties, artiestkaart)" } },
      { tag: "feat", text: { fr: "ShareModal : partage Discord (copie markdown), Twitter/X, copie de lien", en: "ShareModal: Discord share (markdown copy), Twitter/X, link copy", nl: "ShareModal: Discord-delen (markdown kopie), Twitter/X, link kopiëren" } },
      { tag: "feat", text: { fr: "ReportModal : 6 raisons de signalement + champ détail → POST /ecosystem/reports", en: "ReportModal: 6 report reasons + detail field → POST /ecosystem/reports", nl: "ReportModal: 6 meldingsredenen + detailveld → POST /ecosystem/reports" } },
      { tag: "feat", text: { fr: "ReleaseCard : boutons hover (Maximize2 → detail panel, ListPlus → add to queue), affichage BPM/key", en: "ReleaseCard: hover buttons (Maximize2 → detail panel, ListPlus → add to queue), BPM/key display", nl: "ReleaseCard: hoverknopppen (Maximize2 → detailpaneel, ListPlus → aan wachtrij toevoegen), BPM/toonsoort weergave" } },
      { tag: "feat", text: { fr: "CommentThread : parsing des timestamps @MM:SS → badge cliquable qui seek l'audio à la seconde exacte", en: "CommentThread: @MM:SS timestamp parsing → clickable badge that seeks audio to the exact second", nl: "CommentThread: @MM:SS-tijdstempel parseren → klikbare badge die audio naar de exacte seconde zoekt" } },
      { tag: "fix", text: { fr: "View tracking : scope 'FULL' (valide), reset par releaseId, credentials sur les appels heatmap", en: "View tracking: scope 'FULL' (valid), reset by releaseId, credentials on heatmap calls", nl: "Weergave-tracking: scope 'FULL' (geldig), reset op releaseId, credentials op heatmap-aanroepen" } },
      { tag: "fix", text: { fr: "Stats artiste : totalViews utilisait downloadSessions au lieu de streamEvents — corrigé", en: "Artist stats: totalViews was using downloadSessions instead of streamEvents — fixed", nl: "Artieststatistieken: totalViews gebruikte downloadSessions in plaats van streamEvents — opgelost" } },
    ]
  },
  {
    version: "1.4.0",
    date: "2026-03-06",
    entries: [
      { tag: "feat", text: { fr: "Système Engage : campagnes fan-gate, sessions, actions, newsletter, analytics, export CSV", en: "Engage system: fan-gate campaigns, sessions, actions, newsletter, analytics, CSV export", nl: "Engage-systeem: fan-gate campagnes, sessies, acties, nieuwsbrief, analyses, CSV-export" } },
      { tag: "feat", text: { fr: "Artiste : champ bannerUrl + bouton d'édition inline sur la page profil", en: "Artist: bannerUrl field + inline edit button on profile page", nl: "Artiest: bannerUrl-veld + inline bewerkknop op profielpagina" } },
      { tag: "fix", text: { fr: "Rankings : comptabilise StreamEvent + Comment + Repost + FreeDownloadSession avec pondération", en: "Rankings: counts StreamEvent + Comment + Repost + FreeDownloadSession with weighting", nl: "Ranglijsten: telt StreamEvent + Comment + Repost + FreeDownloadSession met weging" } },
      { tag: "feat", text: { fr: "FollowButton : React Query avec optimistic updates, synchronisation instantanée sur toutes les pages", en: "FollowButton: React Query with optimistic updates, instant sync across all pages", nl: "FollowButton: React Query met optimistische updates, directe synchronisatie op alle pagina's" } },
    ]
  },
  {
    version: "1.3.0",
    date: "2026-03-05",
    entries: [
      { tag: "feat", text: { fr: "Intégration music-web : player HLS, queue, waveform, genres, commentaires timestamp, système partage/report", en: "music-web integration: HLS player, queue, waveform, genres, timestamp comments, share/report system", nl: "music-web integratie: HLS-speler, wachtrij, waveform, genres, tijdstempelreacties, deel/rapporteer-systeem" } },
      { tag: "feat", text: { fr: "Service cron : publication planifiée, validation bots, calcul trust score, revenus mensuels", en: "Cron service: scheduled publishing, bot validation, trust score calculation, monthly revenue", nl: "Cron-service: geplande publicatie, botvalidatie, trust score berekening, maandelijkse inkomsten" } },
      { tag: "feat", text: { fr: "Nginx : deux blocs virtuels (records + music.localhost), auth_request HLS", en: "Nginx: two virtual host blocks (records + music.localhost), HLS auth_request", nl: "Nginx: twee virtuele hostblokken (records + music.localhost), HLS auth_request" } },
    ]
  },
  {
    version: "1.0.0",
    date: "2026-03-01",
    entries: [
      { tag: "feat", text: { fr: "Lancement de la plateforme : auth JWT, dashboard artiste/admin/agence, releases, dubpacks, boutique Stripe, abonnements", en: "Platform launch: JWT auth, artist/admin/agency dashboard, releases, dubpacks, Stripe shop, subscriptions", nl: "Lancering platform: JWT-auth, artiest/admin/bureau dashboard, releases, dubpacks, Stripe-winkel, abonnementen" } },
      { tag: "feat", text: { fr: "Système légal : CGU, CGV, RGPD, mentions légales, cookies", en: "Legal system: T&C, Sales T&C, GDPR, legal notices, cookies", nl: "Juridisch systeem: Gebruiksvoorwaarden, Verkoopvoorwaarden, AVG, juridische vermeldingen, cookies" } },
      { tag: "feat", text: { fr: "Internationalisation : FR / EN / NL avec persistance locale", en: "Internationalization: FR / EN / NL with local persistence", nl: "Internationalisering: FR / EN / NL met lokale persistentie" } },
    ]
  }
];

const TAG_COLORS: Record<Tag, string> = {
  feat: "bg-violet/20 text-violet-light border-violet/30",
  fix: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  perf: "bg-green-500/15 text-green-300 border-green-500/30",
  security: "bg-red-500/15 text-red-300 border-red-500/30",
  design: "bg-blue-500/15 text-blue-300 border-blue-500/30"
};

export default function PatchnotesPage() {
  const { t, locale } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/" className="mb-6 inline-block text-sm text-cream/40 hover:text-cream/70 transition-colors">
          {t.patchnotes.back}
        </Link>
        <h1 className="text-4xl font-bold text-cream">{t.patchnotes.title}</h1>
        <p className="mt-2 text-sm text-cream/50">{t.patchnotes.sub}</p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-0 w-px bg-[rgba(255,255,255,0.07)]" />

        <div className="space-y-12">
          {CHANGELOG.map((patch, pIdx) => (
            <motion.div
              key={patch.version}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: pIdx * 0.08 }}
              className="relative pl-8"
            >
              {/* Dot */}
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-violet bg-bg" />

              {/* Version header */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-violet/20 px-3 py-0.5 text-sm font-bold text-violet-light border border-violet/30">
                  v{patch.version}
                </span>
                <time className="text-xs text-cream/35 font-mono">{patch.date}</time>
              </div>

              {/* Entries */}
              <div className="space-y-2.5">
                {patch.entries.map((entry, eIdx) => (
                  <div key={eIdx} className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_COLORS[entry.tag]}`}>
                      {t.patchnotes[`tag_${entry.tag}` as keyof typeof t.patchnotes]}
                    </span>
                    <p className="text-sm text-cream/75 leading-relaxed">
                      {entry.text[locale]}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-8 text-center">
        <p className="text-xs text-cream/25">
          Sauroraa Records — BE1031.598.463
        </p>
      </div>
    </div>
  );
}
