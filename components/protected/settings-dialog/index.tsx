"use client";

import { Button } from "@/components/ui/button";
import {
  ComputerPhoneSyncFreeIcons,
  Notification01FreeIcons,
  PaintBrush03FreeIcons,
  Settings03FreeIcons,
  UserCircleFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AppearanceTab } from "./appearance";
import { DevicesTab } from "./devices";
import { NotificationsTab } from "./notifications";
import { PersonalInfoTab } from "./personal-info";

interface SettingsDialogProps {
  user?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
  };
  initials: string;
  onDeleteAccount: () => void;
}

const tabs = [
  { id: "personal", label: "Personal info", icon: UserCircleFreeIcons },
  {
    id: "notifications",
    label: "Notifications",
    icon: Notification01FreeIcons,
  },
  { id: "appearance", label: "Appearance", icon: PaintBrush03FreeIcons },
  { id: "devices", label: "Devices", icon: ComputerPhoneSyncFreeIcons },
] as const;

export function SettingsDialog({
  user,
  initials,
  onDeleteAccount,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Sync state when user data loads
  useEffect(() => {
    if (user?.displayName !== undefined) {
      setDisplayName(user.displayName ?? "");
    }
  }, [user?.displayName]);

  useEffect(() => {
    if (user?.email !== undefined) {
      setEmail(user.email ?? "");
    }
  }, [user?.email]);

  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;

    // Small delay to ensure dialog is rendered
    const frame = requestAnimationFrame(() => {
      const activeButton = tabsRef.current.get(activeTab);
      if (activeButton) {
        const container = activeButton.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();

          setIndicator({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          });
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [activeTab, open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" icon={Settings03FreeIcons}>
          Settings
        </Button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/40 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[940px] lg:h-[700px] lg:min-h-[700px] lg:max-h-[700px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-xl focus:outline-none"
                initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-48%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.96, x: "-50%", y: "-48%" }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Visually hidden title for accessibility */}
                <Dialog.Title className="sr-only">Settings</Dialog.Title>

                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  {/* Header with tabs */}
                  <div className="flex items-center bg-gray-50 justify-between border-b border-gray-100 pl-3">
                    <Tabs.List
                      className="relative flex"
                      aria-label="Settings sections"
                    >
                      {tabs.map((tab) => (
                        <Tabs.Trigger
                          key={tab.id}
                          value={tab.id}
                          ref={(el) => {
                            if (el) tabsRef.current.set(tab.id, el);
                          }}
                          className="flex items-center gap-2 px-4 h-12 text-sm font-medium text-gray-500 data-[state=active]:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-t-lg"
                        >
                          <HugeiconsIcon
                            icon={tab.icon}
                            size={16}
                            strokeWidth={2}
                          />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </Tabs.Trigger>
                      ))}

                      {/* Sliding underline indicator */}
                      <motion.div
                        className="absolute bottom-0 h-0.5 bg-gray-900"
                        animate={{
                          left: indicator.left,
                          width: indicator.width,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.15,
                          duration: 0.4,
                        }}
                        aria-hidden="true"
                      />
                    </Tabs.List>

                    <div className="size-12 flex items-center justify-center">
                      <Dialog.Close asChild>
                        <button
                          className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-label="Close settings"
                        >
                          <XIcon className="size-4" strokeWidth={2} />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className="p-6 md:p-12">
                    <Tabs.Content value="personal" className="focus:outline-none">
                      <PersonalInfoTab
                        user={user}
                        initials={initials}
                        displayName={displayName}
                        email={email}
                        onDisplayNameChange={setDisplayName}
                        onEmailChange={setEmail}
                        onDeleteAccount={onDeleteAccount}
                      />
                    </Tabs.Content>

                    <Tabs.Content
                      value="notifications"
                      className="focus:outline-none"
                    >
                      <NotificationsTab />
                    </Tabs.Content>

                    <Tabs.Content
                      value="appearance"
                      className="focus:outline-none"
                    >
                      <AppearanceTab />
                    </Tabs.Content>

                    <Tabs.Content value="devices" className="focus:outline-none">
                      <DevicesTab />
                    </Tabs.Content>
                  </div>
                </Tabs.Root>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
