"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteAccountButton } from "@/components/ui/delete-account-button";
import { Input } from "@/components/ui/input";
import { Selector } from "@/components/ui/selector";
import {
  Camera01FreeIcons,
  Delete02FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useUserInformation,
  useUpdateUserInformation,
} from "@/lib/hooks/user";

interface PersonalInfoTabProps {
  user?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
  };
  initials: string;
  displayName: string;
  email: string;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onDeleteAccount: () => void;
}

const sexOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function PersonalInfoTab({
  user,
  initials,
  displayName,
  email,
  onDisplayNameChange,
  onEmailChange,
  onDeleteAccount,
}: PersonalInfoTabProps) {
  const { data: userInfo, isLoading: isLoadingInfo } = useUserInformation();
  const updateUserInfoMutation = useUpdateUserInformation();

  const [localBirthdate, setLocalBirthdate] = useState<string>("");
  const [localSex, setLocalSex] = useState<string>("");

  // Sync local state when data loads
  useEffect(() => {
    if (userInfo) {
      setLocalBirthdate(userInfo.birthdate || "");
      setLocalSex(userInfo.sex || "");
    }
  }, [userInfo]);

  const handleBirthdateBlur = () => {
    if (localBirthdate !== (userInfo?.birthdate || "")) {
      updateUserInfoMutation.mutate({ birthdate: localBirthdate || null });
    }
  };

  const handleSexChange = (value: string) => {
    setLocalSex(value);
    updateUserInfoMutation.mutate({ sex: value as "male" | "female" });
  };

  const isUpdating = updateUserInfoMutation.isPending;

  return (
    <div className="space-y-10 flex flex-col items-end">
      {/* Profile picture */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-center w-full">
        <div className="sm:col-span-2 pr-8">
          <label className="text-gray-900 font-medium">Profile picture</label>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <div className="relative w-fit">
            <Avatar className="w-20 h-20 border-2 border-gray-100">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              className="absolute -top-1 -left-1 size-8 flex items-center justify-center bg-gray-100 border-2 border-white rounded-full shadow-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Remove profile picture"
            >
              <HugeiconsIcon icon={Delete02FreeIcons} size={16} strokeWidth={2} />
            </button>
            <button
              className="absolute -bottom-1 -right-1 size-8 flex items-center justify-center bg-gray-100 border-2 border-white rounded-full shadow-sm text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Change profile picture"
            >
              <HugeiconsIcon icon={Camera01FreeIcons} size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Display name */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-center w-full">
        <div className="sm:col-span-2 pr-8">
          <label htmlFor="display-name" className="text-gray-900 font-medium">
            Display name
          </label>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <Input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Your name"
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Backup account */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start w-full">
        <div className="sm:col-span-2 space-y-1 pr-8">
          <label htmlFor="backup-email" className="text-gray-900 font-medium">
            Backup account
          </label>
          <p className="text-sm text-gray-500">
            Link an email to your account to back it up in case you lose your
            passkey access
          </p>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <Input
            id="backup-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email"
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Birthdate */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start w-full">
        <div className="sm:col-span-2 space-y-1 pr-8">
          <label htmlFor="birthdate" className="text-gray-900 font-medium">
            Birthdate
          </label>
          <p className="text-sm text-gray-500">
            Used for calculating personalized nutrient limits
          </p>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <Input
            id="birthdate"
            type="date"
            value={localBirthdate}
            onChange={(e) => setLocalBirthdate(e.target.value)}
            onBlur={handleBirthdateBlur}
            disabled={isLoadingInfo || isUpdating}
            className="w-full"
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Biological sex */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start w-full">
        <div className="sm:col-span-2 space-y-1 pr-8">
          <label htmlFor="sex" className="text-gray-900 font-medium">
            Biological sex
          </label>
          <p className="text-sm text-gray-500">
            Used for calculating personalized nutrient limits
          </p>
        </div>
        <div className="sm:col-span-3 flex items-center h-full">
          <Selector
            value={localSex}
            onValueChange={handleSexChange}
            options={sexOptions}
            placeholder="Select sex"
            disabled={isLoadingInfo || isUpdating}
            className="w-full"
          />
        </div>
      </div>

      <div className="h-px w-3/5 bg-gray-100" />

      {/* Danger zone */}
      <div className="grid grid-cols-1 sm:grid-cols-5 items-start">
        <div className="sm:col-span-2 space-y-1 pr-8">
          <h3 className="text-red-600 font-medium">Danger zone</h3>
          <p className="text-sm text-gray-500">
            You will delete all your data like tracked supplements, user
            information and passkey. This action cannot be undone.
          </p>
        </div>
        <div className="sm:col-span-3 flex justify-end items-center h-full">
          <DeleteAccountButton onClick={onDeleteAccount} />
        </div>
      </div>
    </div>
  );
}
