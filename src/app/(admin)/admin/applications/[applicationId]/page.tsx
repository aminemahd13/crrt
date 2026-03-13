import { ApplicationDetailClient } from "./detail-client";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <ApplicationDetailClient applicationId={applicationId} />;
}
