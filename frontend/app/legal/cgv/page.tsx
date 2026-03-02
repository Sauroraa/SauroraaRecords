import Link from "next/link";

export default function CgvPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <div>
        <p className="text-xs text-violet-light font-medium tracking-widest uppercase mb-2">Légal</p>
        <h1 className="text-3xl font-bold text-cream">Conditions Générales de Vente</h1>
        <p className="text-sm text-cream/50 mt-2">Dernière mise à jour : mars 2026 — Applicables à toute transaction sur la plateforme Sauroraa Records.</p>
      </div>

      <Article title="Article 1 — Objet">
        <p>Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des transactions réalisées sur la plateforme Sauroraa Records (BE1031.598.463), qu'il s'agisse de l'achat de contenus musicaux (releases, dubpacks), de l'activation d'abonnements artiste ou agence, ou du versement de pourboires (tips) aux artistes.</p>
      </Article>

      <Article title="Article 2 — Modalités de paiement">
        <p>L'ensemble des paiements est traité de manière sécurisée via <strong className="text-cream">Stripe</strong>, prestataire de services de paiement certifié PCI-DSS. Sauroraa Records ne stocke aucune donnée de carte bancaire.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Paiements acceptés : carte bancaire (Visa, Mastercard, American Express), Bancontact.</li>
          <li>Les prix sont affichés en euros (€) toutes taxes comprises.</li>
          <li>Le débit est effectué au moment de la confirmation de commande.</li>
        </ul>
      </Article>

      <Article title="Article 3 — Commissions et partage des revenus">
        <p>Lors de chaque vente, les revenus sont partagés entre l'artiste et la plateforme selon le plan d'abonnement actif de l'artiste :</p>
        <div className="mt-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-surface2">
                <th className="px-4 py-2.5 text-left text-cream/50 font-medium">Plan</th>
                <th className="px-4 py-2.5 text-right text-cream/50 font-medium">Artiste</th>
                <th className="px-4 py-2.5 text-right text-cream/50 font-medium">Plateforme</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["FREE (gratuit)", "70%", "30%"],
                ["BASIC (4,99€/mois)", "80%", "20%"],
                ["PRO (9,99€/mois)", "90%", "10%"],
              ].map(([plan, artist, label]) => (
                <tr key={plan} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <td className="px-4 py-2.5 text-cream/80">{plan}</td>
                  <td className="px-4 py-2.5 text-right text-violet-light font-medium">{artist}</td>
                  <td className="px-4 py-2.5 text-right text-cream/50">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">Le calcul est effectué automatiquement chaque mois. Les revenus nets sont communiqués à l'artiste via son tableau de bord.</p>
      </Article>

      <Article title="Article 4 — Abonnements artistes et agences">
        <p>Les abonnements sont des engagements mensuels renouvelés automatiquement :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong className="text-cream">ARTIST BASIC</strong> : 4,99€/mois — sorties illimitées, commission 80/20, analytics.</li>
          <li><strong className="text-cream">ARTIST PRO</strong> : 9,99€/mois — commission 90/10, mise en avant, branding.</li>
          <li><strong className="text-cream">AGENCY START</strong> : 14,99€/mois — jusqu'à 5 artistes gérés.</li>
          <li><strong className="text-cream">AGENCY PRO</strong> : 24,99€/mois — artistes illimités, rapports PDF mensuels.</li>
        </ul>
        <p className="mt-2">Le renouvellement automatique peut être désactivé à tout moment depuis le tableau de bord. La résiliation prend effet à la fin de la période en cours.</p>
      </Article>

      <Article title="Article 5 — Résiliation d'abonnement">
        <p>L'utilisateur peut résilier son abonnement à tout moment :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Via son tableau de bord → onglet "Abonnement" → bouton "Résilier".</li>
          <li>Par email à <strong className="text-cream">contact@sauroraarecords.be</strong>.</li>
        </ul>
        <p className="mt-2">Aucun remboursement proratisé n'est accordé pour la période en cours. L'accès aux fonctionnalités premium reste actif jusqu'à la fin de la période facturée.</p>
      </Article>

      <Article title="Article 6 — Remboursements">
        <p>Les contenus numériques (releases, dubpacks) téléchargés ou accessibles ne sont pas remboursables, conformément à l'article VI.53 du Code de droit économique belge relatif aux exceptions au droit de rétractation pour les contenus numériques.</p>
        <p className="mt-2">En cas d'erreur technique avérée ou de contenu non conforme, le client peut contacter <strong className="text-cream">contact@sauroraarecords.be</strong> dans un délai de 14 jours.</p>
      </Article>

      <Article title="Article 7 — Facturation">
        <p>Une facture électronique est générée automatiquement après chaque transaction. Elle est disponible dans le tableau de bord de l'utilisateur.</p>
        <p className="mt-2">Les artistes reçoivent un relevé mensuel détaillant leurs ventes, les commissions appliquées et le montant net versé. Ce relevé est généré le 1er de chaque mois et envoyé par email.</p>
      </Article>

      <Article title="Article 8 — TVA">
        <p>Les prix affichés sont TTC. La TVA applicable est celle en vigueur en Belgique. Les artistes résidant hors Belgique sont responsables de leur propre conformité fiscale.</p>
      </Article>

      <Article title="Article 9 — Droit applicable">
        <p>Les présentes CGV sont soumises au droit belge. Les litiges seront portés devant les juridictions compétentes de Belgique.</p>
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
    { href: "/legal/rgpd", label: "Politique de confidentialité" },
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
