import { Shell } from "@/components/shell";

export default function ArtistPage({ params }: { params: { slug: string } }) {
  return (
    <Shell title={`Artist: ${params.slug}`}>
      <p className="text-white/80">Dynamic artist universe and releases list.</p>
    </Shell>
  );
}
