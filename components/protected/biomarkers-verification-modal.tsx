"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackdropPortal } from "../ui/backdrop-portal";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useBiomarkerReports, useSaveBiomarkers } from "@/lib/hooks";

// Exact structure stored in `reports.raw_biomarkers` (from OCR route):
// [{ name: string; value: number | null; unit: string | null; value_in_text: string | null }, ...]
type RawBiomarkerInDb = {
  name: string;
  value: number | null;
  unit: string | null;
  value_in_text: string | null;
};

interface BiomarkerRow extends RawBiomarkerInDb {
  selected: boolean;
}

export function BiomarkersVerificationModal({
  reportId,
  open,
  onClose,
}: {
  reportId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [biomarkers, setBiomarkers] = useState<BiomarkerRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { data: reports } = useBiomarkerReports();
  const saveMutation = useSaveBiomarkers();
  const isSaving = saveMutation.isPending;

  useEffect(() => {
    if (!open || !reportId) return;

    // Wait until reports are loaded via React Query
    if (!reports) return;

    setLoading(true);
    setError(null);

    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      setError("No report found for this ID.");
      setBiomarkers([]);
      setLoading(false);
      return;
    }

    const raw = report.raw_biomarkers as RawBiomarkerInDb[] | null;
    const list: RawBiomarkerInDb[] = Array.isArray(raw) ? raw : [];

    if (!list.length) {
      setError("No biomarkers found in this report.");
      setBiomarkers([]);
      setLoading(false);
      return;
    }

    const rows: BiomarkerRow[] = list.map((b) => ({
      name: b.name,
      value: b.value,
      unit: b.unit,
      value_in_text: b.value_in_text ?? null,
      selected: true,
    }));

    setBiomarkers(rows);
    setLoading(false);
  }, [open, reportId, reports]);

  const filteredBiomarkers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return biomarkers;
    return biomarkers.filter((b) => b.name.toLowerCase().includes(q));
  }, [biomarkers, search]);

  const selectedCount = useMemo(
    () => biomarkers.filter((b) => b.selected).length,
    [biomarkers]
  );

  const handleToggle = (index: number) => {
    setBiomarkers((prev) =>
      prev.map((b, i) => (i === index ? { ...b, selected: !b.selected } : b))
    );
  };

  const handleNameChange = (index: number, name: string) => {
    setBiomarkers((prev) =>
      prev.map((b, i) => (i === index ? { ...b, name } : b))
    );
  };

  const handleValueChange = (index: number, value: string) => {
    const trimmed = value.trim();
    const parsed =
      trimmed === "" ? null : Number.parseFloat(trimmed.replace(",", "."));

    setBiomarkers((prev) =>
      prev.map((b, i) =>
        i === index
          ? {
              ...b,
              value: parsed === null || Number.isNaN(parsed) ? null : parsed,
            }
          : b
      )
    );
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!reportId) return;

    const selected = biomarkers.filter((b) => b.selected);

    if (selected.length === 0) {
      onClose();
      return;
    }

    setSaveError(null);

    try {
      await saveMutation.mutateAsync({
        reportId,
        biomarkers: selected.map((b) => ({
          name: b.name,
          value: b.value,
          unit: b.unit,
          value_in_text: b.value_in_text,
          selected: true,
        })),
      });

      onClose();
    } catch (err) {
      console.error("Failed to save biomarkers", err);
      const message =
        err instanceof Error ? err.message : "Failed to save biomarkers.";
      setSaveError(message);
    }
  };

  if (!open || !reportId) return null;

  return (
    <BackdropPortal show={open} onClose={handleClose}>
      <div className="bg-white rounded-3xl overflow-hidden md:min-w-[520px] max-h-[80vh] flex flex-col">
        {isSaving ? (
          <div className="flex flex-col items-center justify-between gap-6 px-1 pt-1 pb-4 ">
            <div className="w-full p-10 space-y-2 bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-200">
              <div className="flex justify-between p-2 rounded-full bg-white border borde-gray-100">
                <div className="bg-gray-200 rounded-full w-20 h-3 animate-pulse-gray" />
                <div className="flex gap-2">
                  <div className="bg-gray-200 rounded-full w-12 h-3 animate-pulse-gray" />
                  <div className="bg-gray-200 rounded-full w-8 h-3 animate-pulse-gray" />
                </div>
              </div>
              <div className="flex justify-between p-2 rounded-full bg-white border borde-gray-100">
                <div className="bg-gray-200 rounded-full w-20 h-3 animate-pulse-gray" />
                <div className="flex gap-2">
                  <div className="bg-gray-200 rounded-full w-12 h-3 animate-pulse-gray" />
                  <div className="bg-gray-200 rounded-full w-8 h-3 animate-pulse-gray" />
                </div>
              </div>
              <div className="flex justify-between p-2 rounded-full bg-white border borde-gray-100">
                <div className="bg-gray-200 rounded-full w-20 h-3 animate-pulse-gray" />
                <div className="flex gap-2">
                  <div className="bg-gray-200 rounded-full w-12 h-3 animate-pulse-gray" />
                  <div className="bg-gray-200 rounded-full w-8 h-3 animate-pulse-gray" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <p className="text-lg font-medium">We are saving your results</p>
              <p className="text-gray-500 max-w-xs">
                You can close this window, we will notify you when the analysis
                has finished.
              </p>
              {saveError && (
                <p className="text-red-500 text-sm mt-2">{saveError}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-2 bg-gray-50 border-b border-gray-200">
              <h2 className="text-gray-900 font-medium">
                Extracted biomarkers
              </h2>
              <p className="text-gray-500">
                Verify that your biomarkers information is correct.
              </p>
            </div>

            <div className="px-4 pt-4 space-y-4 overflow-hidden flex-1 flex flex-col relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search biomarkers"
                    className="w-full h-10 px-3 rounded-2xl border border-gray-200 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {selectedCount > 0 && (
                  <span className="px-3 h-10 gap-2 inline-flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border-blue-100 font-medium">
                    {selectedCount} selected
                    <button
                      onClick={() =>
                        setBiomarkers((prev) =>
                          prev.map((b) => ({ ...b, selected: false }))
                        )
                      }
                      className="bg-white p-1 rounded-lg"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </span>
                )}
              </div>
              <div className="bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 right-0 h-12 z-10" />

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="space-y-2 w-full">
                    <div className="h-3 rounded-full bg-gray-100" />
                    <div className="h-3 rounded-full bg-gray-100 w-2/3" />
                    <div className="h-3 rounded-full bg-gray-100" />
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto relative pb-8">
                  <div className="space-y-2 ">
                    {filteredBiomarkers.map((b) => {
                      const index = biomarkers.indexOf(b);

                      return (
                        <button
                          key={`${b.name}-${index}`}
                          type="button"
                          onClick={() =>
                            index >= 0 ? handleToggle(index) : undefined
                          }
                          className="w-full flex items-center justify-between px-3 py-2 gap-2 rounded-2xl hover:bg-gray-50 text-left"
                        >
                          <div className="flex items-center gap-3 flex-1 max-w-xs">
                            <Checkbox
                              checked={b.selected}
                              onCheckedChange={() => {
                                if (index >= 0) {
                                  handleToggle(index);
                                }
                              }}
                            />
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (index >= 0) {
                                  handleNameChange(index, e.target.value);
                                }
                              }}
                              placeholder="Biomarker name"
                              className="text-sm px-3 h-10 flex-1 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-3 w-fit">
                            <input
                              type="number"
                              step="any"
                              value={b.value ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (index >= 0) {
                                  handleValueChange(index, e.target.value);
                                }
                              }}
                              placeholder="—"
                              className="w-fit max-w-16 text-sm font-medium px-2 h-10 rounded-xl bg-gray-50 border border-gray-200 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {b.unit && (
                              <span className=" text-gray-500">{b.unit}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {filteredBiomarkers.length === 0 && !loading && !error && (
                      <p className="text-xs text-gray-500 text-center py-4">
                        No biomarkers found.
                      </p>
                    )}{" "}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 bg-gray-50 p-4 border-t border-gray-200">
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </BackdropPortal>
  );
}
