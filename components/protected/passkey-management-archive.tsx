"use client";

import { ReactNode } from "react";
import { startRegistration } from "@simplewebauthn/browser";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDateShort } from "@/lib/utils";
import {
  Fingerprint,
  InfoIcon,
  Key,
  LogOut,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";

export interface ArchivedPasskey {
  id: string;
  credentialId: string;
  userId: string;
  userName?: string;
  userDisplayName?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    deviceType?: string;
    nickname?: string;
  };
  createdAt: string;
  lastUsedAt?: string;
}

interface Props {
  displayName: string;
  registerLoading: boolean;
  registerError: string | null;
  loading: boolean;
  passkeys: ArchivedPasskey[];
  deleteLoading: string | null;
  handleAddPasskey: () => void;
  handleDeletePasskey: (credentialId: string) => void;
  handleLogout: () => void;
  getDeviceIcon: (deviceType?: string) => ReactNode;
}

/**
 * Archived UI layout for the protected passkey management experience.
 * Not currently used, preserved for potential future reuse.
 */
export function PasskeyManagementArchive({
  displayName,
  registerLoading,
  registerError,
  loading,
  passkeys,
  deleteLoading,
  handleAddPasskey,
  handleDeletePasskey,
  handleLogout,
  getDeviceIcon,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Passkey Management</h1>
          <p className="text-muted-foreground mt-1">Welcome, {displayName}</p>
        </div>
        <Button onClick={handleLogout} variant="secondary" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="bg-accent text-sm p-4 px-5 rounded-md text-foreground flex gap-3 items-center">
        <InfoIcon size={16} strokeWidth={2} />
        This is a protected page. You&apos;re authenticated with passkeys.
      </div>

      <div>
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5" />
                Your Passkeys
              </h2>
              <p>
                Manage your registered passkeys. You can add multiple passkeys
                for different devices.
              </p>
            </div>
            <Button
              onClick={handleAddPasskey}
              disabled={registerLoading}
              size="sm"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              {registerLoading ? "Adding..." : "Add Passkey"}
            </Button>
          </div>
        </div>
        <div>
          {registerError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
              {registerError}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading passkeys...
            </div>
          ) : passkeys.length === 0 ? (
            <div className="text-center py-8">
              <Fingerprint className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No passkeys registered yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getDeviceIcon(passkey.deviceInfo?.deviceType)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {passkey.deviceInfo?.nickname ||
                          passkey.userDisplayName ||
                          `${passkey.deviceInfo?.deviceType || "Device"}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {passkey.deviceInfo?.browser &&
                          passkey.deviceInfo?.os && (
                            <span>
                              {passkey.deviceInfo.browser} •{" "}
                              {passkey.deviceInfo.os}
                            </span>
                          )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {formatDateShort(passkey.createdAt)}
                        {passkey.lastUsedAt && (
                          <span className="ml-3">
                            Last used: {formatDateShort(passkey.lastUsedAt)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeletePasskey(passkey.credentialId)}
                    disabled={
                      deleteLoading === passkey.credentialId ||
                      passkeys.length === 1
                    }
                    variant="default"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteLoading === passkey.credentialId
                      ? "Deleting..."
                      : "Delete"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {passkeys.length === 1 && (
            <p className="mt-4 text-xs text-muted-foreground text-center">
              ⚠️ You cannot delete your last passkey. Add another passkey before
              removing this one.
            </p>
          )}
        </div>
      </div>

      <div>
        <div>
          <h2 className="text-lg">Security Tips</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Register passkeys on multiple devices for backup access</p>
          <p>
            • Passkeys are more secure than passwords and resistant to phishing
          </p>
          <p>• Your biometric data never leaves your device</p>
          <p>• Remove passkeys from devices you no longer use</p>
        </div>
      </div>
    </>
  );
}

export interface ArchiveFetchPasskeysDeps {
  userId: string;
  setLoading: (value: boolean) => void;
  setPasskeys: (passkeys: ArchivedPasskey[]) => void;
}

export const archiveFetchPasskeys = async ({
  userId,
  setLoading,
  setPasskeys,
}: ArchiveFetchPasskeysDeps) => {
  try {
    setLoading(true);
    const response = await fetch("/api/passkey/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (response.ok) {
      const data = await response.json();
      setPasskeys(data.passkeys || []);
    }
  } catch (error) {
    console.error("Failed to fetch passkeys:", error);
  } finally {
    setLoading(false);
  }
};

export interface ArchiveHandleAddPasskeyDeps {
  userId: string;
  displayName: string;
  passkeysCount: number;
  setRegisterLoading: (value: boolean) => void;
  setRegisterError: (value: string | null) => void;
  fetchPasskeys: () => Promise<void>;
}

export const archiveHandleAddPasskey = async ({
  userId,
  displayName,
  passkeysCount,
  setRegisterLoading,
  setRegisterError,
  fetchPasskeys,
}: ArchiveHandleAddPasskeyDeps) => {
  try {
    const nickname =
      prompt("Enter a nickname for this passkey:") ||
      `Passkey ${passkeysCount + 1}`;

    setRegisterLoading(true);
    setRegisterError(null);

    const startResp = await fetch("/api/passkey/register/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        userName: displayName,
        userDisplayName: nickname,
      }),
    });

    if (!startResp.ok) {
      const { error } = await startResp.json();
      throw new Error(error || "Failed to start registration");
    }

    const options = await startResp.json();
    const attResp = await startRegistration({ optionsJSON: options });

    const finishResp = await fetch("/api/passkey/register/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credential: attResp,
        userName: displayName,
        userDisplayName: nickname,
        deviceInfo: {},
      }),
    });

    if (!finishResp.ok) {
      const { error } = await finishResp.json();
      throw new Error(error || "Failed to finish registration");
    }

    const result = await finishResp.json();
    if (result.verified) {
      await fetchPasskeys();
    } else {
      alert("Failed to register passkey");
    }
  } catch (error) {
    console.error("Failed to add passkey:", error);
    alert("Failed to add passkey. Please try again.");
    setRegisterError((error as Error)?.message || "Registration failed");
  } finally {
    setRegisterLoading(false);
  }
};

export interface ArchiveHandleDeletePasskeyDeps {
  userId: string | null;
  credentialId: string;
  setDeleteLoading: (value: string | null) => void;
  fetchPasskeys: () => Promise<void>;
}

export const archiveHandleDeletePasskey = async ({
  userId,
  credentialId,
  setDeleteLoading,
  fetchPasskeys,
}: ArchiveHandleDeletePasskeyDeps) => {
  if (!confirm("Are you sure you want to delete this passkey?")) return;

  try {
    setDeleteLoading(credentialId);
    const response = await fetch("/api/passkey/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, credentialId }),
    });

    if (response.ok && userId) {
      await fetchPasskeys();
    } else {
      alert("Failed to delete passkey");
    }
  } catch (error) {
    console.error("Failed to delete passkey:", error);
    alert("Failed to delete passkey. Please try again.");
  } finally {
    setDeleteLoading(null);
  }
};

export interface ArchiveHandleLogoutDeps {
  router: { push: (href: string) => void };
}

export const archiveHandleLogout = async ({
  router,
}: ArchiveHandleLogoutDeps) => {
  const supabase = createClient();
  await supabase.auth.signOut();
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  router.push("/auth");
};

export const archiveGetDeviceIcon = (deviceType?: string): ReactNode => {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="w-5 h-5" />;
    case "desktop":
      return <Monitor className="w-5 h-5" />;
    default:
      return <Key className="w-5 h-5" />;
  }
};
