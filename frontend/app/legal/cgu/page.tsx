import Link from "next/link";

export default function CguPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <div>
        <p className="text-xs text-violet-light font-medium tracking-widest uppercase mb-2">Légal</p>
        <h1 className="text-3xl font-bold text-cream">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-cream/50 mt-2">Dernière mise à jour : mars 2026 — Applicables à partir de l'inscription sur la plateforme.</p>
      </div>

      <Article title="Article 1 — Objet">
        <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Sauroraa Records, accessible à l'adresse <strong className="text-cream">sauroraarecords.be</strong>, éditée par Sauroraa Records (BE1031.598.463).</p>
        <p className="mt-2">En s'inscrivant sur la plateforme, l'utilisateur accepte sans réserve les présentes CGU.</p>
      </Article>

      <Article title="Article 2 — Accès et création de compte">
        <p>L'accès à certaines fonctionnalités de la plateforme est conditionné à la création d'un compte personnel. L'inscription est gratuite et ouverte à toute personne physique ou morale.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>L'utilisateur doit fournir une adresse email valide et un mot de passe sécurisé.</li>
          <li>L'utilisateur est responsable de la confidentialité de ses identifiants.</li>
          <li>Toute utilisation du compte avec les identifiants fournis est réputée effectuée par l'utilisateur.</li>
          <li>L'utilisateur s'engage à notifier immédiatement toute utilisation non autorisée de son compte.</li>
        </ul>
      </Article>

      <Article title="Article 3 — Rôles et types de comptes">
        <p>La plateforme propose plusieurs types de comptes :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong className="text-cream">Utilisateur (Client)</strong> : peut écouter, acheter et télécharger des contenus.</li>
          <li><strong className="text-cream">Artiste</strong> : peut publier des releases, dubpacks et gérer ses revenus.</li>
          <li><strong className="text-cream">Agence</strong> : peut gérer plusieurs artistes et accéder à des outils avancés.</li>
          <li><strong className="text-cream">Staff</strong> : accès à la modération des contenus.</li>
          <li><strong className="text-cream">Administrateur</strong> : accès complet à la gestion de la plateforme.</li>
        </ul>
      </Article>

      <Article title="Article 4 — Responsabilité de l'utilisateur">
        <p>L'utilisateur s'engage à :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Utiliser la plateforme conformément aux lois en vigueur en Belgique et dans l'Union européenne.</li>
          <li>Ne pas publier de contenu illégal, diffamatoire, obscène, raciste, haineux ou contrefaisant.</li>
          <li>Respecter les droits de propriété intellectuelle des tiers.</li>
          <li>Ne pas tenter de contourner les mécanismes de sécurité de la plateforme.</li>
          <li>Ne pas utiliser la plateforme à des fins de spam, phishing ou toute activité frauduleuse.</li>
        </ul>
      </Article>

      <Article title="Article 5 — Contenu publié par les artistes">
        <p>L'artiste qui publie un contenu sur la plateforme déclare et garantit :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Être titulaire de tous les droits nécessaires sur les œuvres publiées (droits d'auteur, droits voisins, droits de synchronisation).</li>
          <li>Que la publication dudit contenu ne porte pas atteinte aux droits de tiers.</li>
          <li>Assumer l'entière responsabilité du contenu qu'il publie.</li>
        </ul>
        <p className="mt-2">Sauroraa Records se réserve le droit de retirer tout contenu qui contreviendrait aux présentes CGU sans préavis ni indemnité.</p>
      </Article>

      <Article title="Article 6 — Propriété intellectuelle">
        <p>L'artiste conserve la propriété intellectuelle de ses œuvres publiées sur la plateforme. En publiant son contenu, l'artiste accorde à Sauroraa Records une licence non-exclusive, mondiale, pour la durée de la mise en ligne, aux fins de diffusion, promotion et vente via la plateforme.</p>
        <p className="mt-2">Sauroraa Records conserve la propriété de tous les éléments de la plateforme elle-même (code, design, marque, logo).</p>
      </Article>

      <Article title="Article 7 — Suspension et résiliation de compte">
        <p>Sauroraa Records se réserve le droit de suspendre ou de supprimer tout compte :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>En cas de violation des présentes CGU.</li>
          <li>En cas d'activité frauduleuse.</li>
          <li>Sur demande de l'autorité judiciaire compétente.</li>
        </ul>
        <p className="mt-2">L'utilisateur peut également supprimer son compte à tout moment depuis son espace personnel ou en contactant <strong className="text-cream">contact@sauroraarecords.be</strong>.</p>
      </Article>

      <Article title="Article 8 — Modification des CGU">
        <p>Sauroraa Records se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email ou notification sur la plateforme. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles CGU.</p>
      </Article>

      <Article title="Article 9 — Droit applicable et juridiction compétente">
        <p>Les présentes CGU sont soumises au droit belge. En cas de litige, les parties s'engagent à tenter de trouver une solution amiable avant tout recours judiciaire. À défaut, les juridictions belges seront seules compétentes.</p>
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
    { href: "/legal/cgv", label: "CGV" },
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
