"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "./button";
import { Delete02FreeIcons } from "@hugeicons/core-free-icons";

export function DeleteAccountButton() {
  return (
    <Button variant={"destructive-secondary"}>
      <HugeiconsIcon icon={Delete02FreeIcons} strokeWidth={2} />
      Delete account
    </Button>
  );
}
