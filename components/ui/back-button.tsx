import { ArrowLeft01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

export function BackButton({ title }: { title: string }) {
  const router = useRouter();

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => router.back()}
      className="flex items-center gap-2 text-gray-600"
    >
      <div className="flex items-center justify-center size-8 rounded-xl bg-gray-100 ">
        <HugeiconsIcon icon={ArrowLeft01FreeIcons} className="w-4 h-4" />
      </div>
      <span className="font-medium">Back to {title.toLowerCase()}</span>
    </motion.button>
  );
}
