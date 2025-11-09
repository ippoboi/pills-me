"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import {
  InfoIcon,
  Fingerprint,
  Trash2,
  Plus,
  LogOut,
  Smartphone,
  Monitor,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface Passkey {
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

export default function ProtectedPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    // Determine auth via app cookie
    const checkSession = async () => {
      try {
        const meResp = await fetch("/api/auth/me");
        if (!meResp.ok) {
          router.push("/auth");
          return;
        }
        const me = await meResp.json();
        setUserId(me.id);
        setDisplayName(me.displayName || "User");
        fetchPasskeys(me.id);
      } catch {
        router.push("/auth");
      }
    };

    checkSession();
  }, [router]);

  const fetchPasskeys = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/passkey/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
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

  const handleAddPasskey = async () => {
    if (!userId) return;

    try {
      const nickname =
        prompt("Enter a nickname for this passkey:") ||
        `Passkey ${passkeys.length + 1}`;

      setRegisterLoading(true);
      setRegisterError(null);
      // Start registration
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
        await fetchPasskeys(userId);
      } else {
        alert("Failed to register passkey");
      }
    } catch (error) {
      console.error("Failed to add passkey:", error);
      alert("Failed to add passkey. Please try again.");
      setRegisterError((error as any)?.message || "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDeletePasskey = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this passkey?")) return;

    try {
      setDeleteLoading(credentialId);
      const response = await fetch("/api/passkey/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, credentialId }),
      });

      if (response.ok && userId) {
        await fetchPasskeys(userId);
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/auth");
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "desktop":
        return <Monitor className="w-5 h-5" />;
      default:
        return <Key className="w-5 h-5" />;
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Passkey Management</h1>
          <p className="text-muted-foreground mt-1">Welcome, {displayName}</p>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-accent text-sm p-4 px-5 rounded-md text-foreground flex gap-3 items-center">
        <InfoIcon size="16" strokeWidth={2} />
        This is a protected page. You're authenticated with passkeys.
      </div>

      {/* Passkeys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5" />
                Your Passkeys
              </CardTitle>
              <CardDescription>
                Manage your registered passkeys. You can add multiple passkeys
                for different devices.
              </CardDescription>
            </div>
            <Button
              onClick={handleAddPasskey}
              disabled={registerLoading}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {registerLoading ? "Adding..." : "Add Passkey"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                        Created:{" "}
                        {new Date(passkey.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        {passkey.lastUsedAt && (
                          <span className="ml-3">
                            Last used:{" "}
                            {new Date(passkey.lastUsedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
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
                    variant="destructive"
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
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Register passkeys on multiple devices for backup access</p>
          <p>
            • Passkeys are more secure than passwords and resistant to phishing
          </p>
          <p>• Your biometric data never leaves your device</p>
          <p>• Remove passkeys from devices you no longer use</p>
        </CardContent>
      </Card>
    </div>
  );
}
