/**
 * Environment variable validation for PillsMe application
 * Validates all required environment variables at startup
 */

interface EnvValidationError {
  variable: string;
  issue: string;
}

const REQUIRED_ENV_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    validator: (value: string) => {
      try {
        new URL(value);
        return value.includes("supabase.co") || value.includes("localhost");
      } catch {
        return false;
      }
    },
    description: "Must be a valid Supabase URL",
  },
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
    required: true,
    validator: (value: string) => {
      // Support both old anon keys (eyJ...) and new publishable keys (sb_publishable_...)
      return (
        value.length >= 32 &&
        (value.startsWith("eyJ") || value.startsWith("sb_publishable_"))
      );
    },
    description:
      "Must be a valid Supabase publishable key (starts with 'eyJ' or 'sb_publishable_')",
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    validator: (value: string) => {
      // Support both old service role keys (eyJ...) and new service role keys (sb_service_role_...)
      return (
        value.length >= 32 &&
        (value.startsWith("eyJ") || value.startsWith("sb_secret_"))
      );
    },
    description:
      "Must be a valid Supabase service role key (starts with 'eyJ' or 'sb_secret_')",
  },
  APP_SESSION_SECRET: {
    required: true,
    validator: (value: string) => value.length >= 32,
    description: "Must be at least 32 characters long for security",
  },
  NEXT_PUBLIC_RP_ID: {
    required: true,
    validator: (value: string) => value.length > 0 && !value.includes(" "),
    description: "Must be a valid relying party ID (domain or localhost)",
  },
  NEXT_PUBLIC_RP_NAME: {
    required: true,
    validator: (value: string) => value.length > 0,
    description: "Must be a non-empty application name",
  },
  NEXT_PUBLIC_EXPECTED_ORIGIN: {
    required: true,
    validator: (value: string) => {
      // Can be comma-separated list of origins
      const origins = value.split(",").map((o) => o.trim());
      return origins.every((origin) => {
        try {
          new URL(origin);
          return true;
        } catch {
          return false;
        }
      });
    },
    description: "Must be valid URL(s), comma-separated if multiple",
  },
} as const;

/**
 * Validates all required environment variables
 * Throws an error with detailed information if validation fails
 */
export function validateEnvironmentVariables(): void {
  const errors: EnvValidationError[] = [];

  // Check each required environment variable
  for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];

    if (!value) {
      errors.push({
        variable: varName,
        issue: "Missing required environment variable",
      });
      continue;
    }

    if (!config.validator(value)) {
      errors.push({
        variable: varName,
        issue: config.description,
      });
    }
  }

  // If there are validation errors, throw with detailed information
  if (errors.length > 0) {
    const errorMessage = [
      "❌ Environment Variable Validation Failed:",
      "",
      ...errors.map((error) => `  • ${error.variable}: ${error.issue}`),
      "",
      "📋 Required environment variables:",
      ...Object.entries(REQUIRED_ENV_VARS).map(
        ([name, config]) => `  • ${name}: ${config.description}`
      ),
      "",
      "💡 Create a .env or .env.local file in your project root with the required variables.",
      "   See README.md for setup instructions.",
    ].join("\n");

    throw new Error(errorMessage);
  }

  console.log("✅ All environment variables validated successfully");
}

/**
 * Gets a validated environment variable
 * Assumes validateEnvironmentVariables() has already been called
 */
export function getEnvVar(name: keyof typeof REQUIRED_ENV_VARS): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable ${name} is not set. This should not happen after validation.`
    );
  }
  return value;
}

/**
 * Check if we're in a server environment (not browser)
 */
export function isServerEnvironment(): boolean {
  return typeof window === "undefined";
}
