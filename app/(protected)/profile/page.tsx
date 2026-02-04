"use client";

import { useMemo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Copy01FreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useCurrentUser } from "@/lib/hooks";
import PushNotificationManager from "@/components/pwa/push-notification-manager";
import { DeleteAccountButton } from "@/components/ui/delete-account-button";
import DeleteAccountModal from "@/components/protected/delete-account-modal";
import { Badge } from "@/components/ui/badge";
import { SettingsDialog } from "@/components/protected/settings-dialog";

export default function ProfilePage() {
  const [isCopied, setIsCopied] = useState(false);
  const { data: user, isLoading, error, isFetching } = useCurrentUser();

  const initials = useMemo(() => {
    const source = user?.displayName;
    if (!source) return "U";
    const parts = source
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
    return parts || "U";
  }, [user?.displayName]);

  const showLoading = isLoading || isFetching;

  useEffect(() => {
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [isCopied]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="mx-auto min-h-screen pb-40 pt-4 md:py-32 md:pb-48 px-4 ">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Profile Header */}
        <div className="flex w-full flex-col gap-5 items-start bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <div className="flex justify-between items-center w-full">
            <h2 className="uppercase text-gray-500 font-medium">Profile</h2>
            <SettingsDialog
              user={user}
              initials={initials}
              onDeleteAccount={() => setDeleteModalOpen(true)}
            />
          </div>
          <div className="flex w-full flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center justify-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-2xl font-medium">
                    {showLoading ? (
                      <div className="w-20 h-8 rounded-lg bg-gray-200 animate-pulse-gray" />
                    ) : error ? (
                      "We couldn't load your name"
                    ) : (
                      user?.displayName
                    )}
                  </h1>
                  <AnimatePresence mode="wait" initial={false}>
                    {user?.username ?? (
                      <motion.button
                        onClick={() => {
                          setIsCopied(!isCopied);
                        }}
                        key={isCopied ? "copied" : "copy"}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                        className="text-gray-500 font-medium cursor-pointer"
                      >
                        {isCopied ? (
                          <div className="flex items-center gap-1">
                            <p className="">Copied</p>
                            <HugeiconsIcon
                              icon={Tick02FreeIcons}
                              size={18}
                              strokeWidth={2}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className="">
                              {"#" + (user?.username ?? "XZO23")}
                            </p>
                            <HugeiconsIcon
                              icon={Copy01FreeIcons}
                              size={18}
                              strokeWidth={2}
                            />
                          </div>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <Badge
                label={"Setup email backup"}
                colorClass="text-orange-500"
                backgroundClass="bg-orange-50"
                onPress={() => {}}
                rightChevron
                pressable
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge
              label={"GMT+1 - Brussels, Copenhagen, Madrid, Paris"}
              colorClass="text-blue-600"
              backgroundClass="bg-blue-50"
            />
            <Badge
              label={"Refill"}
              colorClass="text-gray-600"
              backgroundClass="bg-gray-50"
            />
            <Badge
              label={"Intake"}
              colorClass="text-gray-600"
              backgroundClass="bg-gray-50"
            />
            <Badge
              label={"App Updates"}
              colorClass="text-gray-600"
              backgroundClass="bg-gray-50"
            />
          </div>
        </div>

        {/* Stats section */}
        <div className="flex w-full flex-col  gap-4 items-start bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <h2 className="uppercase text-gray-500 font-medium">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-white w-fit rounded-3xl p-4 border-2 border-blue-600 shadow-sm scale-75 md:scale-100">
                <div
                  className="bg-blue-600 w-10 h-10"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-medium text-gray-800">
                  {user?.dayStreak ?? 0}{" "}
                  <span className="text-lg text-gray-500">d</span>
                </h3>
                <p className="uppercase text-gray-500 font-medium">
                  tracking history
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-white w-fit rounded-3xl p-4 border-2 border-blue-600 shadow-sm scale-75 md:scale-100">
                <div
                  className="bg-blue-600 w-10 h-10"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-medium text-gray-800">
                  {user?.supplementsCount ?? 0}
                </h3>
                <p className="uppercase text-gray-500 font-medium">
                  supplements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard section */}
        <div className="flex w-full flex-col  gap-4 items-start bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <h2 className="uppercase text-gray-500 font-medium">Leaderboard</h2>
        </div>

        {/* Browser Notifications Section - Only show when there are browser-level issues */}
        <PushNotificationManager />

        <div className="w-full py-4 flex justify-center">
          <div className="h-px w-4/5 bg-gray-200 rounded-full" />
        </div>

        {/* Danger zone section */}
        <div className="flex w-full flex-col md:flex-row gap-6 md:gap-32 md:items-center bg-white p-6 md:p-8 rounded-[32px] shadow-sm">
          <div className="space-y-2">
            <h2 className="text-red-600 text-lg">Danger zone</h2>
            <p className="text-gray-600 ">
              You will delete all your data like tracked supplements, user
              information and passkey. This action cannot be undone.
            </p>
          </div>
          <DeleteAccountButton onClick={() => setDeleteModalOpen(true)} />
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
