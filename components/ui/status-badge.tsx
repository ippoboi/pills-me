import { SupplementStatus } from "@/lib/types";
import { SUPPLEMENT_STATUS_CONFIGS } from "@/lib/utils/supplements";
import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";

export function StatusBadge({
  status,
  showIcon,
}: {
  status: SupplementStatus;
  showIcon: boolean;
}) {
  const config = SUPPLEMENT_STATUS_CONFIGS.find((c) => c.value === status);
  return (
    <div
      className={`${config?.backgroundClass} ${config?.colorClass} flex justify-items-center items-center justify-center px-2 h-8 rounded-xl font-medium`}
    >
      {showIcon ? (
        <HugeiconsIcon
          icon={config?.icon as HugeiconsIconProps["icon"]}
          strokeWidth={2}
          className="block w-5 h-5 flex-shrink-0"
        />
      ) : null}
      <span className="px-1 leading-none translate-y-[1px]">
        {config?.label}
      </span>
    </div>
  );
}
