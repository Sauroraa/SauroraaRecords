import Link from "next/link";

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <div>
        <p className="text-xs text-violet-light font-medium tracking-widest uppercase mb-2">Légal</p>
        <h1 className="text-3xl font-bold text-cream">Politique Cookies</h1>
        <p className="text-sm text-cream/50 mt-2">Conforme au RGPD et à la directive ePrivacy. Dernière mise à jour : mars 2026.</p>
      </div>

      <Article title="1. Qu'est-ce qu'un cookie ?">
        <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite afin d'améliorer votre expérience et de fournir des fonctionnalités essentielles.</p>
      </Article>

      <Article title="2. Cookies utilisés sur Sauroraa Records">
        <div className="mt-2 rounded-[12px] border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-surface2">
                <th className="px-4 py-3 text-left text-cream/50 font-medium text-xs">Nom</th>
                <th className="px-4 py-3 text-left text-cream/50 font-medium text-xs">Type</th>
                <th className="px-4 py-3 text-left text-cream/50 font-medium text-xs">Durée</th>
                <th className="px-4 py-3 text-left text-cream/50 font-medium text-xs">Finalité</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["access_token", "Technique (httpOnly)", "15 min", "Authentification JWT"],
                ["refresh_token", "Technique (httpOnly)", "30 jours", "Renouvellement session"],
                ["cookie_consent", "Préférence", "1 an", "Mémorisation du consentement cookies"],
                ["sauroraa-auth", "Technique (localStorage)", "Session", "Zustand auth store persisté"],
                ["sauroraa-cart", "Technique (localStorage)", "Session", "Zustand cart store persisté"],
              ].map(([name, type, dur, desc]) => (
                <tr key={name as string} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-violet-light">{name}</td>
                  <td className="px-4 py-2.5 text-cream/60">{type}</td>
                  <td className="px-4 py-2.5 text-cream/50">{dur}</td>
                  <td className="px-4 py-2.5 text-cream/70">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Article>

      <Article title="3. Types de cookies par catégorie">
        <div className="space-y-4 mt-2">
          <CookieType
            title="Cookies strictement nécessaires"
            required
            description="Ces cookies sont indispensables au fonctionnement du site. Ils gèrent votre session d'authentification et votre panier. Ils ne peuvent pas être désactivés."
          />
          <CookieType
            title="Cookies de préférences"
            description="Ces cookies mémorisent vos choix (consentement cookies, préférences de lecture). Ils peuvent être supprimés depuis votre navigateur."
          />
          <CookieType
            title="Cookies analytiques"
            description="Actuellement, Sauroraa Records n'utilise pas de cookies d'analytics tiers. Toute analyse de performance est effectuée côté serveur de manière anonymisée."
          />
          <CookieType
            title="Cookies marketing"
            description="Sauroraa Records n'utilise pas de cookies publicitaires ou de tracking marketing tiers."
          />
        </div>
      </Article>

      <Article title="4. Consentement et gestion de vos préférences">
        <p>Lors de votre première visite, une bannière vous demande votre consentement pour les cookies non essentiels. Vous pouvez :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Accepter tous les cookies.</li>
          <li>Refuser les cookies non essentiels.</li>
          <li>Modifier vos préférences à tout moment en supprimant la clé <code className="text-violet-light font-mono text-xs">cookie_consent</code> de votre localStorage.</li>
        </ul>
        <p className="mt-2">Votre choix est stocké localement dans votre navigateur et reste valide pendant 1 an.</p>
      </Article>

      <Article title="5. Suppression des cookies via le navigateur">
        <p>Vous pouvez supprimer ou bloquer les cookies à tout moment depuis les paramètres de votre navigateur :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong className="text-cream">Chrome</strong> : Paramètres → Confidentialité → Cookies</li>
          <li><strong className="text-cream">Firefox</strong> : Options → Vie privée → Cookies et données</li>
          <li><strong className="text-cream">Safari</strong> : Préférences → Confidentialité → Cookies</li>
        </ul>
        <p className="mt-2">Note : la désactivation des cookies strictement nécessaires peut altérer le fonctionnement du site (déconnexion automatique, perte du panier).</p>
      </Article>

      <Article title="6. Contact">
        <p>Pour toute question relative à l'utilisation des cookies : <strong className="text-cream">privacy@sauroraarecords.be</strong></p>
      </Article>

      <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
        <LegalNav />
      </div>
    </div>
  );
}

function CookieType({ title, required = false, description }: { title: string; required?: boolean; description: string }) {
  return (
    <div className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium text-cream">{title}</p>
        {required && (
          <span className="text-[10px] bg-violet/20 text-violet-light px-2 py-0.5 rounded-full">Requis</span>
        )}
      </div>
      <p className="text-xs text-cream/60 leading-relaxed">{description}</p>
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
    { href: "/legal/rgpd", label: "Politique de confidentialité" },
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
