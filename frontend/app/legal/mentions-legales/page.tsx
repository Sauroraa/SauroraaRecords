import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <div>
        <p className="text-xs text-violet-light font-medium tracking-widest uppercase mb-2">Légal</p>
        <h1 className="text-3xl font-bold text-cream">Mentions légales</h1>
        <p className="text-sm text-cream/50 mt-2">Conformément aux articles 14 et 15 de la loi belge du 11 mars 2003 sur la société de l'information.</p>
      </div>

      <Section title="1. Éditeur du site">
        <Row label="Dénomination sociale" value="Sauroraa Records" />
        <Row label="Numéro d'entreprise" value="BE1031.598.463" />
        <Row label="Forme juridique" value="Personne morale / Entreprise belge" />
        <Row label="Siège social" value="Belgique" />
        <Row label="Email de contact" value="contact@sauroraarecords.be" />
        <Row label="Responsable de la publication" value="Équipe Sauroraa Records" />
      </Section>

      <Section title="2. Hébergement">
        <Row label="Hébergeur" value="Serveur dédié Debian 12" />
        <Row label="Adresse IP serveur" value="141.11.165.20" />
        <Row label="Localisation" value="Union Européenne" />
      </Section>

      <Section title="3. Activité">
        <p className="text-sm text-cream/70 leading-relaxed">
          Sauroraa Records est une plateforme digitale de distribution musicale destinée aux artistes indépendants et aux agences musicales. La plateforme permet la publication, la vente et le téléchargement de contenus musicaux (releases, dubpacks) dans le cadre d'un modèle de partage de revenus transparent.
        </p>
      </Section>

      <Section title="4. Propriété intellectuelle">
        <p className="text-sm text-cream/70 leading-relaxed">
          L'ensemble des éléments constituant ce site (textes, graphiques, logotypes, icônes, images, clips audio) est la propriété exclusive de Sauroraa Records ou de ses partenaires, et est protégé par les lois belges et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
        </p>
      </Section>

      <Section title="5. Limitation de responsabilité">
        <p className="text-sm text-cream/70 leading-relaxed">
          Sauroraa Records s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Sauroraa Records ne peut garantir l'exactitude, la complétude ou l'actualité des informations diffusées. L'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive. Sauroraa Records ne saurait être tenu responsable des dommages directs ou indirects résultant de l'accès au site ou de l'utilisation de son contenu.
        </p>
      </Section>

      <Section title="6. Droit applicable">
        <p className="text-sm text-cream/70 leading-relaxed">
          Le présent site est soumis au droit belge. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des juridictions belges.
        </p>
      </Section>

      <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
        <LegalNav />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-cream">{title}</h2>
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-3">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="text-cream/40 w-48 shrink-0">{label}</span>
      <span className="text-cream/80">{value}</span>
    </div>
  );
}

function LegalNav() {
  const pages = [
    { href: "/legal/cgu", label: "CGU" },
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
