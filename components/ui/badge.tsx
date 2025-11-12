import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";

export function Badge({
  label,
  colorClass,
  backgroundClass,
  icon,
}: {
  label: string;
  colorClass: string;
  backgroundClass: string;
  icon?: HugeiconsIconProps["icon"];
}) {
  return (
    <div
      className={`${backgroundClass} ${colorClass} flex justify-items-center items-center justify-center px-2 h-8 rounded-xl font-medium`}
    >
      {icon ? (
        <HugeiconsIcon
          icon={icon as HugeiconsIconProps["icon"]}
          strokeWidth={2}
          className="block w-5 h-5 flex-shrink-0"
        />
      ) : null}
      <span className="px-1 leading-none translate-y-[1px]">{label}</span>
    </div>
  );
}
