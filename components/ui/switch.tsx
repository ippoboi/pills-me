import { useState } from "react";

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  className = "",
}: SwitchProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleClick = () => {
    if (disabled) return;

    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center rounded-full w-12 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isChecked
          ? "bg-blue-600 border-blue-600"
          : "bg-gray-300 border-gray-300"
      } ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <div
        className={`bg-white rounded-full w-6 h-6 transition-transform duration-200 ease-in-out ${
          isChecked ? "translate-x-[22px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
