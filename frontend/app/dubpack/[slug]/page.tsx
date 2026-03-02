import { fetchDubpack, fetchComments } from "@/lib/api";
import { notFound } from "next/navigation";
import { DubpackDetailClient } from "./dubpack-detail-client";

interface Props {
  params: { slug: string };
}

export default async function DubpackPage({ params }: Props) {
  const [dubpack, comments] = await Promise.all([
    fetchDubpack(params.slug),
    fetchComments({ dubpackId: params.slug })
  ]);

  if (!dubpack) notFound();

  return <DubpackDetailClient dubpack={dubpack} initialComments={comments} />;
}
