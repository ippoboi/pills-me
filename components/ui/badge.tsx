import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export function Badge({
  label,
  colorClass,
  backgroundClass,
  rightChevron,
  icon,
  pressable,
  onPress,
}: {
  label: string;
  colorClass: string;
  backgroundClass: string;
  rightChevron?: boolean;
  icon?: HugeiconsIconProps["icon"];
  pressable?: boolean;
  onPress?: () => void;
}) {
  const baseClassName = `${backgroundClass} ${colorClass} flex justify-items-center items-center justify-center px-2 h-8 rounded-xl font-medium`;

  if (pressable) {
    return (
      <motion.div
        className={`${baseClassName} cursor-pointer select-none`}
        role="button"
        tabIndex={0}
        whileTap={{ scale: 0.98 }}
        onClick={onPress}
      >
        {icon ? (
          <HugeiconsIcon
            icon={icon as HugeiconsIconProps["icon"]}
            strokeWidth={2}
            className="block size-4 flex-shrink-0"
          />
        ) : null}
        <span className="tabular-nums px-1 leading-none translate-y-[1px]">
          {label}
        </span>
        {rightChevron && <ChevronRight size={20} />}
      </motion.div>
    );
  }

  return (
    <div className={baseClassName}>
      {icon ? (
        <HugeiconsIcon
          icon={icon as HugeiconsIconProps["icon"]}
          strokeWidth={2}
          className="block size-4 flex-shrink-0"
        />
      ) : null}
      <span className="tabular-nums px-1 leading-none translate-y-[1px]">
        {label}
      </span>
      {rightChevron && <ChevronRight size={20} />}
    </div>
  );
}
