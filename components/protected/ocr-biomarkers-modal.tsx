"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar04FreeIcons,
  RefreshFreeIcons,
  Delete02FreeIcons,
} from "@hugeicons/core-free-icons";
import { BackdropPortal } from "../ui/backdrop-portal";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CloudUpload, FileText, Clock } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import Image from "next/image";
import { useAnalyzeBiomarkerReport } from "@/lib/hooks";

interface FormData {
  reportName: string;
  collectionDate: string;
  collectionTime: string;
}

interface FormErrors {
  reportName?: string;
  collectionDate?: string;
  collectionTime?: string;
}

export default function OCRBiomarkersModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [collectionDate, setCollectionDate] = useState<Date | undefined>();
  const [collectionDateOpen, setCollectionDateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    reportName: "",
    collectionDate: "",
    collectionTime: "08:00",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const analyzeMutation = useAnalyzeBiomarkerReport();
  const isAnalyzing = analyzeMutation.isPending;

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        const validTypes = ["image/png", "image/jpeg", "application/pdf"];
        if (!validTypes.includes(file.type)) {
          alert("Please select a PNG, JPEG, or PDF file");
          return;
        }

        // Validate file size (20 MB)
        const maxSize = 20 * 1024 * 1024; // 20 MB in bytes
        if (file.size > maxSize) {
          alert("File size must be less than 20 MB");
          return;
        }

        // Clean up previous preview if exists
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const previewUrl = URL.createObjectURL(file);
          setImagePreview(previewUrl);
        } else {
          setImagePreview(null);
        }

        setSelectedFile(file);
        // Auto-generate report name from file name (without extension)
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setFormData((prev) => ({
          ...prev,
          reportName: fileName || "",
        }));
        // Auto-advance to step 2
        setCurrentStep(2);
      }
    },
    [imagePreview]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        const validTypes = ["image/png", "image/jpeg", "application/pdf"];
        if (!validTypes.includes(file.type)) {
          alert("Please select a PNG, JPEG, or PDF file");
          return;
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          alert("File size must be less than 20 MB");
          return;
        }

        // Clean up previous preview if exists
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const previewUrl = URL.createObjectURL(file);
          setImagePreview(previewUrl);
        } else {
          setImagePreview(null);
        }

        setSelectedFile(file);
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setFormData((prev) => ({
          ...prev,
          reportName: fileName || "",
        }));
        // Auto-advance to step 2
        setCurrentStep(2);
      }
    },
    [imagePreview]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const handleRemoveFile = () => {
    // Clean up preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFormData((prev) => ({
      ...prev,
      reportName: "",
    }));
    // Go back to step 1 when file is removed
    setCurrentStep(1);
  };

  const validateStep2 = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.reportName.trim()) {
      errors.reportName = "Report name is required";
    }

    if (!formData.collectionDate) {
      errors.collectionDate = "Collection date is required";
    }

    if (!formData.collectionTime) {
      errors.collectionTime = "Collection time is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setFormErrors((prev) => ({
        ...prev,
        reportName: prev.reportName,
      }));
      return;
    }

    if (!validateStep2()) {
      return;
    }

    try {
      setAnalysisError(null);

      await analyzeMutation.mutateAsync({
        file: selectedFile,
        reportName: formData.reportName,
        collectedDate: formData.collectionDate,
        collectedTime: formData.collectionTime,
        timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // On success, reset and close. The biomarker page will refresh via react-query.
      resetForm();
      onClose();
    } catch (error) {
      console.error("OCR analysis failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to analyze lab report.";
      setAnalysisError(message);
      return;
    }
  };

  const handleCancel = () => {
    if (currentStep === 1) {
      handleClose();
    } else {
      setCurrentStep(1);
    }
  };

  const resetForm = () => {
    // Clean up preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setCurrentStep(1);
    setSelectedFile(null);
    setCollectionDate(undefined);
    setFormData({
      reportName: "",
      collectionDate: "",
      collectionTime: "",
    });
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!isAnalyzing) {
      resetForm();
    }
    onClose();
  };

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Sync collection date with form data
  const handleDateSelect = (date: Date | undefined) => {
    setCollectionDate(date);
    if (date) {
      const dateString =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
      setFormData((prev) => ({
        ...prev,
        collectionDate: dateString,
      }));
      setFormErrors((prev) => ({ ...prev, collectionDate: undefined }));
    }
    setCollectionDateOpen(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileType = (file: File): string => {
    if (file.type === "application/pdf") return "PDF";
    if (file.type === "image/png") return "PNG";
    if (file.type === "image/jpeg") return "JPEG";
    return file.type.split("/")[1]?.toUpperCase() || "FILE";
  };

  return (
    <BackdropPortal show={open} onClose={handleClose}>
      <div className="bg-white rounded-[20px] overflow-hidden md:min-w-[500px]">
        {isAnalyzing ? (
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
              <p className="text-lg font-medium">
                We are analyzing your Lab report
              </p>
              <p className="text-gray-500 max-w-xs">
                You can close this window, we will notify you when the analysis
                has finished.
              </p>
              {analysisError && (
                <p className="text-red-500 text-sm mt-2">{analysisError}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gray-50 border-b-gray-200 border-b flex justify-between items-center py-4 px-5">
              <span>
                {currentStep === 1 ? "Upload Lab Report" : "Fill informations"}
              </span>
              <div className="text-gray-500">
                <span className="text-gray-900">{currentStep}</span> / 2
              </div>
            </div>

            {/* Step 1: File Upload */}
            {currentStep === 1 && (
              <div className="p-4">
                <div
                  className="flex px-12 py-20 hover:bg-gray-50 transition-colors cursor-pointer gap-4 flex-col justify-center items-center border border-dashed rounded-2xl"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-3 rounded-xl bg-white border border-gray-100">
                    <CloudUpload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex flex-col justify-center items-center max-w-md gap-2">
                    <p className="text-lg font-medium">Drop Lab Report here</p>
                    <p className="text-center text-gray-500">
                      We accept files in PNG, PDF, and JPEG formats, with a
                      maximum size of 20 MB.
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpeg,.jpg,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Step 2: Form */}
            {currentStep === 2 && (
              <div className="p-4 space-y-4">
                {/* File Info */}
                {selectedFile && (
                  <div className="flex items-center gap-3 p-1 rounded-xl border border-gray-200">
                    <div className="w-[52px] h-[52px] rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={52}
                          height={52}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getFileType(selectedFile)} •{" "}
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        title="Replace file"
                      >
                        <HugeiconsIcon
                          icon={RefreshFreeIcons}
                          className="w-5 h-5 text-gray-500"
                          strokeWidth={2}
                        />
                      </button>
                      <button
                        onClick={handleRemoveFile}
                        className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        title="Remove file"
                      >
                        <HugeiconsIcon
                          icon={Delete02FreeIcons}
                          className="w-5 h-5 text-gray-500"
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpeg,.jpg,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Report Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Report name
                  </label>
                  <input
                    type="text"
                    placeholder="Report name"
                    value={formData.reportName}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        reportName: e.target.value,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        reportName: undefined,
                      }));
                    }}
                    className={`w-full px-3 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.reportName
                        ? "border-red-300"
                        : "border-gray-100"
                    }`}
                  />
                  {formErrors.reportName && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.reportName}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Collection Date */}
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium">
                      Collection date
                    </label>
                    <Popover
                      open={collectionDateOpen}
                      onOpenChange={setCollectionDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <button
                          className={`w-full px-3 pr-12 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left relative ${
                            formErrors.collectionDate
                              ? "border-red-300"
                              : "border-gray-100"
                          }`}
                        >
                          <span
                            className={
                              collectionDate ? "text-gray-900" : "text-gray-400"
                            }
                          >
                            {collectionDate
                              ? formatDateShort(collectionDate)
                              : "Select a collection date"}
                          </span>
                          <div className="pointer-events-none -mr-px bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <HugeiconsIcon
                              icon={Calendar04FreeIcons}
                              className="w-4 h-4 text-gray-400"
                              strokeWidth={2}
                            />
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={collectionDate}
                          onSelect={handleDateSelect}
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.collectionDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.collectionDate}
                      </p>
                    )}
                  </div>

                  {/* Collection Time */}
                  <div className="w-fit">
                    <label className="block mb-2 text-sm font-medium">
                      Collection time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.collectionTime}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            collectionTime: e.target.value,
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            collectionTime: undefined,
                          }));
                        }}
                        className={`w-full px-3 pr-12 h-10 border rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${
                          formErrors.collectionTime
                            ? "border-red-300"
                            : "border-gray-100"
                        } ${
                          !formData.collectionTime
                            ? "text-gray-400"
                            : "text-gray-900"
                        }`}
                        style={{
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                        }}
                      />
                      <div className="pointer-events-none bg-white rounded-[10px] h-9 w-9 border border-gray-200 absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {formErrors.collectionTime && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.collectionTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer - Only show on step 2 */}
            {currentStep === 2 && (
              <div className="flex w-full justify-between bg-gray-50 p-4 border-t border-gray-200">
                <Button variant="outline" onClick={handleCancel}>
                  Back
                </Button>
                <Button onClick={handleAnalyze}>Analyze</Button>
              </div>
            )}
          </>
        )}
      </div>
    </BackdropPortal>
  );
}
