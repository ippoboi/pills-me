import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from "@simplewebauthn/server";

export type RPConfig = {
  rpID: string;
  expectedOrigin: string | string[];
  rpName: string;
};

/**
 * Read RP configuration from environment and support multiple expected origins.
 * NEXT_PUBLIC_EXPECTED_ORIGIN may be a comma-separated list.
 */
export function getRPConfig(): RPConfig {
  const rpID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
  const rpName = process.env.NEXT_PUBLIC_RP_NAME || "PillsMe";
  const expectedOriginEnv =
    process.env.NEXT_PUBLIC_EXPECTED_ORIGIN || "http://localhost:3000";

  // Support comma-separated expected origins
  const parts = expectedOriginEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const expectedOrigin = parts.length > 1 ? parts : parts[0];

  return { rpID, expectedOrigin, rpName };
}

/**
 * Helper to build common registration options defaults.
 */
export function getDefaultRegistrationOptions(): Pick<
  GenerateRegistrationOptionsOpts,
  "authenticatorSelection" | "attestationType" | "timeout"
> {
  return {
    timeout: 60_000,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  };
}

/**
 * Helper to build common authentication options defaults.
 */
export function getDefaultAuthenticationOptions(): Pick<
  GenerateAuthenticationOptionsOpts,
  "timeout" | "userVerification"
> {
  return {
    timeout: 60_000,
    userVerification: "required",
  };
}
