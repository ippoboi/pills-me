"use client";

import OCRBiomarkersModal from "@/components/protected/ocr-biomarkers-modal";
import { BiomarkersVerificationModal } from "@/components/protected/biomarkers-verification-modal";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { LabReportCard } from "./lab-report-card";
import { useBiomarkerReports } from "@/lib/hooks";

export default function Biomarkers() {
  const [open, setOpen] = useState(false);
  const [verificationReportId, setVerificationReportId] = useState<
    string | null
  >(null);
  const { data: reports, isLoading, error, refetch } = useBiomarkerReports();

  const hasReports = useMemo(() => (reports?.length ?? 0) > 0, [reports]);

  return (
    <>
      <OCRBiomarkersModal
        open={open}
        onClose={() => {
          setOpen(false);
          // Refresh reports when the modal closes in case a new report was uploaded.
          refetch();
        }}
      />
      <BiomarkersVerificationModal
        reportId={verificationReportId}
        open={verificationReportId !== null}
        onClose={() => {
          setVerificationReportId(null);
          // Refresh reports when the modal closes to reflect status changes
          refetch();
        }}
      />
      <div className="flex flex-col items-center gap-4 min-h-screen p-4 py-12 md:p-12 bg-white">
        <div className="flex flex-col gap-8 md:max-w-5xl w-full">
          <div className="flex justify-between items-center mb-4">
            <BackButton title="profile" />
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Upload report
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-20rem)]">
              <div className="h-4 w-40 rounded-full bg-gray-100" />
              <div className="h-3 w-64 rounded-full bg-gray-100" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-20rem)]">
              <p className="text-red-500 text-sm">
                {error instanceof Error
                  ? error.message
                  : "Failed to load lab reports."}
              </p>
            </div>
          ) : !hasReports ? (
            <div className="flex flex-col items-center justify-center gap-8 h-[calc(100vh-20rem)]">
              <Image
                src="/illustration-empty-biomarkers.png"
                alt="Biomarkers"
                width={426}
                height={181}
              />
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <h1 className="text-xl font-medium">
                    You currently track 0 biomarkers
                  </h1>
                  <p className="text-gray-500 text-xl">
                    Upload a <span className="text-blue-600">lab report</span>{" "}
                    to start tracking.
                  </p>
                </div>
                <Button onClick={() => setOpen(true)}>
                  <Plus />
                  Upload Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <section className="lg:col-span-2 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="flex flex-col items-center justify-center gap-8 h-[calc(100vh-20rem)]">
                  <Image
                    src="/illustration-empty-biomarkers.png"
                    alt="Biomarkers"
                    width={426}
                    height={181}
                  />
                  <div className="flex flex-col items-center justify-center gap-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h1 className="text-xl font-medium">
                        You currently track 0 biomarkers
                      </h1>
                      <p className="text-gray-500 text-xl">
                        Upload a{" "}
                        <span className="text-blue-600">lab report</span> to
                        start tracking.
                      </p>
                    </div>
                    <Button onClick={() => setOpen(true)}>
                      <Plus />
                      Upload Report
                    </Button>
                  </div>
                </div>
              </section>
              <section className="col-span-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Latest labs</span>
                  <button className="text-gray-500 hover:text-gray-700 flex items-center">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-3">
                  {reports!.map((report) => (
                    <LabReportCard
                      key={report.id}
                      report={report}
                      onVerificationClick={setVerificationReportId}
                    />
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
