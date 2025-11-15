import SupplementDetail from "@/components/protected/supplement-detail";
import { getSupplementById, supplementsKeys } from "@/lib/queries";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { headers } from "next/headers";

export default async function SupplementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  // Get timezone from headers or default to UTC
  const headersList = await headers();
  const timezone = headersList.get("x-timezone") || "UTC";

  await queryClient.prefetchQuery({
    queryKey: supplementsKeys.byId(id),
    queryFn: () => getSupplementById(id, timezone),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SupplementDetail params={params} />
    </HydrationBoundary>
  );
}
