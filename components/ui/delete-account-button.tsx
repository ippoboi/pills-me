"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "./button";
import { Delete02FreeIcons } from "@hugeicons/core-free-icons";

interface DeleteAccountButtonProps {
  onClick?: () => void;
}

export function DeleteAccountButton({ onClick }: DeleteAccountButtonProps) {
  return (
    <Button
      variant={"destructive-secondary"}
      onClick={onClick}
      icon={Delete02FreeIcons}
    >
      Delete account
    </Button>
  );
}
