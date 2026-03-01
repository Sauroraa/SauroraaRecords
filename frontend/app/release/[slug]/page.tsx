import { Shell } from "@/components/shell";

export default function ReleasePage({ params }: { params: { slug: string } }) {
  return (
    <Shell title={`Release: ${params.slug}`}>
      <p className="text-white/80">Interactive release page with audio preview and purchase action.</p>
    </Shell>
  );
}
