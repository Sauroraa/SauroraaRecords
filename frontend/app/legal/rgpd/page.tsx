import Link from "next/link";

export default function RgpdPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <div>
        <p className="text-xs text-violet-light font-medium tracking-widest uppercase mb-2">Légal</p>
        <h1 className="text-3xl font-bold text-cream">Politique de Confidentialité</h1>
        <p className="text-sm text-cream/50 mt-2">Conforme au Règlement Général sur la Protection des Données (RGPD) — UE 2016/679. Dernière mise à jour : mars 2026.</p>
      </div>

      <Article title="Article 1 — Responsable du traitement">
        <p>Le responsable du traitement des données personnelles est :</p>
        <div className="mt-2 space-y-1">
          <p><strong className="text-cream">Sauroraa Records</strong> — BE1031.598.463</p>
          <p>Email DPO / contact RGPD : <strong className="text-cream">privacy@sauroraarecords.be</strong></p>
        </div>
      </Article>

      <Article title="Article 2 — Données collectées">
        <p>Nous collectons les données suivantes :</p>
        <div className="mt-3 space-y-3">
          {[
            {
              cat: "Données d'identification",
              items: ["Adresse email", "Nom d'affichage", "Rôle sur la plateforme"]
            },
            {
              cat: "Données de profil artiste / agence",
              items: ["Nom d'artiste", "Biographie", "Photo de profil", "Liens réseaux sociaux", "Données bancaires (via Stripe, non stockées par nous)"]
            },
            {
              cat: "Données de transaction",
              items: ["Historique des achats", "Abonnements", "Revenus générés", "Factures"]
            },
            {
              cat: "Données techniques",
              items: ["Adresse IP", "Type de navigateur", "Pages visitées", "Cookies techniques"]
            }
          ].map((c) => (
            <div key={c.cat}>
              <p className="text-cream/80 font-medium text-xs uppercase tracking-wide">{c.cat}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {c.items.map((i) => <li key={i} className="text-cream/60">{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Article>

      <Article title="Article 3 — Finalités du traitement">
        <div className="space-y-2">
          {[
            ["Exécution du contrat", "Gestion des comptes, traitement des commandes, versement des revenus, facturation."],
            ["Intérêt légitime", "Sécurité de la plateforme, prévention de la fraude, analyses statistiques anonymisées."],
            ["Consentement", "Envoi d'emails marketing et de newsletters (opt-in explicite)."],
            ["Obligation légale", "Conservation des données de facturation conformément à la législation fiscale belge (7 ans)."],
          ].map(([base, desc]) => (
            <div key={base as string} className="flex gap-3">
              <span className="text-violet-light font-medium text-xs w-36 shrink-0 pt-0.5">{base}</span>
              <span className="text-cream/70">{desc}</span>
            </div>
          ))}
        </div>
      </Article>

      <Article title="Article 4 — Durée de conservation">
        <div className="space-y-1">
          {[
            ["Données de compte actif", "Pendant toute la durée du compte + 3 ans après clôture"],
            ["Données de transaction / factures", "7 ans (obligation légale comptable belge)"],
            ["Logs techniques", "12 mois maximum"],
            ["Données marketing (opt-in)", "Jusqu'au retrait du consentement"],
          ].map(([type, dur]) => (
            <div key={type as string} className="flex gap-3 text-sm">
              <span className="text-cream/50 w-48 shrink-0">{type}</span>
              <span className="text-cream/70">{dur}</span>
            </div>
          ))}
        </div>
      </Article>

      <Article title="Article 5 — Droits des utilisateurs">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong className="text-cream">Droit d'accès</strong> : obtenir une copie de vos données personnelles.</li>
          <li><strong className="text-cream">Droit de rectification</strong> : corriger des données inexactes.</li>
          <li><strong className="text-cream">Droit à l'effacement</strong> ("droit à l'oubli") : supprimer vos données sous réserve des obligations légales.</li>
          <li><strong className="text-cream">Droit à la portabilité</strong> : recevoir vos données dans un format lisible par machine.</li>
          <li><strong className="text-cream">Droit d'opposition</strong> : vous opposer au traitement à des fins de marketing.</li>
          <li><strong className="text-cream">Droit de limitation</strong> : restreindre le traitement dans certains cas.</li>
        </ul>
        <p className="mt-2">Pour exercer ces droits : <strong className="text-cream">privacy@sauroraarecords.be</strong>. Réponse sous 30 jours.</p>
        <p className="mt-2">En cas de litige non résolu, vous pouvez vous adresser à l'<strong className="text-cream">Autorité de Protection des Données belge (APD)</strong> : <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noreferrer" className="text-violet-light hover:underline">autoriteprotectiondonnees.be</a></p>
      </Article>

      <Article title="Article 6 — Sous-traitants et destinataires des données">
        <div className="space-y-2">
          {[
            ["Stripe", "Traitement des paiements — PCI-DSS Level 1 — États-Unis (clauses contractuelles types UE)"],
            ["Serveur dédié UE", "Hébergement des données — Localisation : Union Européenne"],
          ].map(([name, desc]) => (
            <div key={name as string} className="flex gap-3 text-sm">
              <span className="text-cream/80 font-medium w-32 shrink-0">{name}</span>
              <span className="text-cream/60">{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-3">Nous ne vendons pas vos données personnelles à des tiers.</p>
      </Article>

      <Article title="Article 7 — Transfert hors UE">
        <p>Les données traitées via Stripe peuvent faire l'objet d'un transfert vers les États-Unis. Ce transfert est encadré par les clauses contractuelles types approuvées par la Commission européenne, conformément à l'article 46 du RGPD.</p>
      </Article>

      <Article title="Article 8 — Sécurité">
        <p>Sauroraa Records met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS/TLS), authentification sécurisée (JWT httpOnly), accès restreints par rôle, pare-feu serveur (UFW + Fail2ban).</p>
      </Article>

      <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
        <LegalNav />
      </div>
    </div>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-cream">{title}</h2>
      <div className="text-sm text-cream/70 leading-relaxed">{children}</div>
    </div>
  );
}

function LegalNav() {
  const pages = [
    { href: "/legal/mentions-legales", label: "Mentions légales" },
    { href: "/legal/cgu", label: "CGU" },
    { href: "/legal/cgv", label: "CGV" },
    { href: "/legal/cookies", label: "Politique cookies" },
  ];
  return (
    <div className="flex flex-wrap gap-4">
      {pages.map((p) => (
        <Link key={p.href} href={p.href} className="text-xs text-cream/40 hover:text-cream/70 transition-colors">
          {p.label}
        </Link>
      ))}
    </div>
  );
}
