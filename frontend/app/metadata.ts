import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "https://sauroraarecords.be" }
};

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://sauroraarecords.be/#organization",
      name: "Sauroraa Records",
      url: "https://sauroraarecords.be",
      logo: {
        "@type": "ImageObject",
        url: "https://sauroraarecords.be/icon.png",
        width: 512,
        height: 512
      },
      sameAs: [
        "https://www.instagram.com/sauroraarecords",
        "https://soundcloud.com/sauroraarecords"
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "BE"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://sauroraarecords.be/#website",
      url: "https://sauroraarecords.be",
      name: "Sauroraa Records",
      publisher: { "@id": "https://sauroraarecords.be/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://sauroraarecords.be/catalog?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};