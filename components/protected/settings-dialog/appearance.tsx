"use client";

import { useState } from "react";
import Image from "next/image";
import { Selector } from "@/components/ui/selector";

type InterfaceStyle = "system" | "light" | "dark";

interface StyleButtonProps {
  style: InterfaceStyle;
  label: string;
  imageSrc: string;
  isSelected: boolean;
  onSelect: (style: InterfaceStyle) => void;
}

// With icon (like language selector)
const languageOptions = [
  { value: "en", label: "English", icon: <span>🇬🇧</span> },
  { value: "fr", label: "Français", icon: <span>🇫🇷</span> },
  { value: "de", label: "Deutsch", icon: <span>🇩🇪</span> },
];

// Without icon (like start week selector)
const weekStartOptions = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday", label: "Saturday" },
];

export function AppearanceTab() {
  const [selectedStyle, setSelectedStyle] = useState<InterfaceStyle>("system");
  const [language, setLanguage] = useState<string>("en");
  const [weekStart, setWeekStart] = useState<string>("monday");

  // TODO: Connect to theme provider/selector later
  const handleStyleChange = (style: InterfaceStyle) => {
    setSelectedStyle(style);
    // Placeholder: Will connect to actual theme switching logic
    console.log("Interface style changed to:", style);
  };

  return (
    <div className="space-y-10 flex flex-col items-end">
      {/* Interface style */}
      <div className="grid grid-cols-1 sm:grid-cols-5 w-full">
        <div className="sm:col-span-2 pr-8">
          <label className="text-gray-900 font-medium">Interface style</label>
        </div>
        <div className="sm:col-span-3 flex items-center h-full gap-6">
          <StyleButton
            style="system"
            label="System"
            imageSrc="/images/interface-system.png"
            isSelected={selectedStyle === "system"}
            onSelect={handleStyleChange}
          />
          <StyleButton
            style="light"
            label="Light"
            imageSrc="/images/interface-light.png"
            isSelected={selectedStyle === "light"}
            onSelect={handleStyleChange}
          />
          <StyleButton
            style="dark"
            label="Dark"
            imageSrc="/images/interface-dark.png"
            isSelected={selectedStyle === "dark"}
            onSelect={handleStyleChange}
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Language */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-center w-full">
        <div className="sm:col-span-2 pr-8">
          <label className="text-gray-900 font-medium">Language</label>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <Selector
            value={language}
            onValueChange={setLanguage}
            options={languageOptions}
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Date & Time format */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start w-full">
        <div className="sm:col-span-2 space-y-1 pr-8">
          <label className="text-gray-900 font-medium">
            Date & Time format
          </label>
        </div>
        <div className="sm:col-span-3 flex items-center h-full"></div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Start week on */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start w-full">
        <div className="sm:col-span-2 space-y-1 pr-8">
          <label className="text-gray-900 font-medium">Start week on</label>
          <p className="text-sm text-gray-500">
            Choose the date of the week that starts the week
          </p>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <Selector
            value={weekStart}
            onValueChange={setWeekStart}
            options={weekStartOptions}
          />
        </div>
      </div>
    </div>
  );
}

function StyleButton({
  style,
  label,
  imageSrc,
  isSelected,
  onSelect,
}: StyleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(style)}
      className="flex flex-col items-center group gap-2 cursor-pointer"
    >
      <Image
        src={imageSrc}
        alt={`Interface ${style}`}
        width={280}
        height={200}
        className={`w-[140px] h-[100px] rounded-2xl border-2 pointer-events-none transition-colors object-cover ${
          isSelected
            ? "border-blue-600"
            : "border-gray-100 hover:border-blue-200"
        }`}
      />
      <span
        className={`font-medium text-sm transition-colors ${
          isSelected ? "text-blue-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
