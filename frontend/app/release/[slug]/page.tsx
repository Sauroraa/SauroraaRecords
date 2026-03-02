import { fetchRelease, fetchComments } from "@/lib/api";
import { notFound } from "next/navigation";
import { ReleaseDetailClient } from "./release-detail-client";

export default async function ReleasePage({ params }: { params: { slug: string } }) {
  const [release, comments] = await Promise.all([
    fetchRelease(params.slug),
    fetchRelease(params.slug).then(async (r) => {
      if (!r) return [];
      return fetchComments({ releaseId: r.id });
    })
  ]);

  if (!release) notFound();

  return <ReleaseDetailClient release={release} initialComments={comments} />;
}
