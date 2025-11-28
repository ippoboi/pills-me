import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { biomarkersKeys } from "../keys/keys";
import {
  getBiomarkerReports,
  getBiomarkersOverview,
} from "../queries/biomarkers";
import {
  analyzeBiomarkerReport,
  saveBiomarkers,
} from "../mutations/biomarkers";
import type {
  BiomarkerReport,
  SaveBiomarkersRequestBody,
  SaveBiomarkersResponse,
  BiomarkersApiResponse,
  SortBy,
} from "../types";

export function useBiomarkerReports() {
  return useQuery<BiomarkerReport[], Error>({
    queryKey: biomarkersKeys.reports(),
    queryFn: getBiomarkerReports,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Biomarkers overview (grouped by STATUS or CATEGORY)
export function useBiomarkersOverview(sortBy: SortBy = "STATUS") {
  return useQuery<BiomarkersApiResponse, Error>({
    queryKey: biomarkersKeys.overview(sortBy),
    queryFn: () => getBiomarkersOverview(sortBy),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAnalyzeBiomarkerReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeBiomarkerReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: biomarkersKeys.reports(),
      });
    },
  });
}

interface SaveBiomarkersContext {
  previousReports: BiomarkerReport[] | null;
}

export function useSaveBiomarkers() {
  const queryClient = useQueryClient();

  return useMutation<
    SaveBiomarkersResponse,
    Error,
    SaveBiomarkersRequestBody,
    SaveBiomarkersContext
  >({
    mutationFn: saveBiomarkers,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: biomarkersKeys.reports(),
      });

      const previousReports =
        (queryClient.getQueryData<BiomarkerReport[]>(
          biomarkersKeys.reports()
        ) as BiomarkerReport[] | undefined) ?? null;

      // Optimistically mark the report as SAVING
      if (previousReports) {
        const nextReports = previousReports.map((report) =>
          report.id === variables.reportId
            ? { ...report, status: "SAVING" as BiomarkerReport["status"] }
            : report
        );

        queryClient.setQueryData(biomarkersKeys.reports(), nextReports);
      }

      const context: SaveBiomarkersContext = { previousReports };
      return context;
    },
    onError: (error, _variables, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(
          biomarkersKeys.reports(),
          context.previousReports
        );
      }
      console.error("Failed to save biomarkers:", error);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: biomarkersKeys.reports(),
        }),
        // Invalidate any biomarker overview queries (STATUS / CATEGORY)
        queryClient.invalidateQueries({
          queryKey: biomarkersKeys.all(),
        }),
      ]);
    },
  });
}
