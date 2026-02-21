import { Button } from "@/components/ui/button";
import { Database, Download, Eye, Lock, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LastUpdatedDate } from "./LastUpdatedDate";

export const metadata = {
  title: "Privacy Policy | Pillker",
  description: "Learn how Pillker protects your health data and privacy.",
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Pillker Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Pillker
            </span>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-full px-6">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-blue-50 p-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-800">
              Your health data is yours. Here&apos;s how we protect it.
            </p>
            <LastUpdatedDate />
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700">
            {/* Introduction */}
            <section className="rounded-2xl bg-gray-50 p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-blue-600" />
                Our Commitment to Privacy
              </h2>
              <p className="text-gray-900 leading-relaxed">
                Pillker is built with privacy and security as foundational
                principles. We believe your health data belongs to you, and
                we&apos;ve designed our application to give you complete control
                while maintaining the highest standards of security. As an
                open-source application, you can audit our code to verify our
                privacy practices.
              </p>
            </section>

            {/* Data We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Database className="h-6 w-6 text-blue-600" />
                Information We Collect
              </h2>
              <div className="space-y-4 text-gray-900">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Account Information
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Display name (provided during registration)</li>
                    <li>
                      User ID (automatically generated, unique identifier)
                    </li>
                    <li>
                      Passkey credentials (stored securely for authentication)
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Supplement Data
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Supplement names and descriptions</li>
                    <li>Dosage information (capsules per dose)</li>
                    <li>
                      Schedule preferences (morning, lunch, dinner, before
                      sleep)
                    </li>
                    <li>Start and end dates for supplement regimens</li>
                    <li>Inventory counts and refill history</li>
                    <li>Source URLs (if you choose to add them)</li>
                    <li>Supplement status (active, completed, cancelled)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Usage Data
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Adherence records (when you mark supplements as taken)
                    </li>
                    <li>Day streaks and consistency metrics</li>
                    <li>Notification interaction data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Notification Preferences
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Push notification subscription data (endpoint, keys)
                    </li>
                    <li>
                      Notification preferences (reminders, refill alerts, app
                      updates)
                    </li>
                    <li>Timezone information (for accurate scheduling)</li>
                    <li>Device information (for push notification delivery)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Security & Audit Data
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Authentication events (login attempts, passkey
                      registrations)
                    </li>
                    <li>
                      IP addresses (for security monitoring and rate limiting)
                    </li>
                    <li>User agent information (for debugging and support)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Eye className="h-6 w-6 text-blue-600" />
                How We Use Your Information
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  We use your information solely to provide and improve the
                  Pillker service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Service Delivery:</strong> To track your
                    supplements, manage inventory, calculate adherence metrics,
                    and send you reminders
                  </li>
                  <li>
                    <strong>Notifications:</strong> To deliver push
                    notifications at your scheduled times and alert you when
                    inventory is running low
                  </li>
                  <li>
                    <strong>Security:</strong> To authenticate you securely
                    using passkey technology and protect against unauthorized
                    access
                  </li>
                  <li>
                    <strong>Analytics:</strong> To calculate your adherence
                    percentages, streaks, and provide insights into your
                    supplement routine
                  </li>
                  <li>
                    <strong>Support:</strong> To troubleshoot issues and provide
                    customer support when needed
                  </li>
                </ul>
                <p className="mt-4 font-semibold text-gray-900">
                  We do not sell, rent, or share your personal information with
                  third parties for marketing purposes. We do not use your data
                  to show you advertisements.
                </p>
              </div>
            </section>

            {/* Data Storage & Security */}
            <section className="rounded-2xl bg-blue-50 p-8 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-blue-600" />
                Data Storage & Security
              </h2>
              <div className="space-y-4 text-gray-900">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Where Your Data is Stored
                  </h3>
                  <p>
                    Your data is stored securely in a PostgreSQL database hosted
                    by Supabase, a trusted infrastructure provider. All data is
                    encrypted at rest and in transit using industry-standard
                    encryption protocols.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Security Measures
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Passkey Authentication:</strong> We use
                      WebAuthn/Passkey technology instead of passwords. This
                      means we never store passwords that could be compromised,
                      and authentication is cryptographically bound to your
                      domain.
                    </li>
                    <li>
                      <strong>Row Level Security (RLS):</strong> Database-level
                      security policies ensure that you can only access your own
                      data. Even if there were a breach, other users&apos; data
                      would remain inaccessible.
                    </li>
                    <li>
                      <strong>Rate Limiting:</strong> We protect against brute
                      force attacks by limiting authentication attempts (5
                      requests per 15 minutes).
                    </li>
                    <li>
                      <strong>Content Security Policy:</strong> Strict CSP
                      headers protect against cross-site scripting (XSS)
                      attacks.
                    </li>
                    <li>
                      <strong>Audit Logging:</strong> All authentication events
                      are logged for security monitoring and compliance
                      purposes.
                    </li>
                    <li>
                      <strong>Automated Cleanup:</strong> Expired authentication
                      challenges are automatically removed to minimize data
                      exposure.
                    </li>
                    <li>
                      <strong>Open Source:</strong> Our codebase is open source,
                      allowing security researchers and users to audit our
                      security practices.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Third-Party Services
              </h2>
              <div className="space-y-4 text-gray-900">
                <p>
                  Pillker uses the following third-party services to operate:
                </p>
                <div className="rounded-xl bg-gray-50 p-6 border border-gray-100">
                  <ul className="space-y-3">
                    <li>
                      <strong>Supabase:</strong> Database and authentication
                      infrastructure. Supabase is GDPR compliant and stores data
                      in secure, encrypted databases.
                      <a
                        href="https://supabase.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        View Supabase Privacy Policy
                      </a>
                    </li>
                    <li>
                      <strong>Vercel:</strong> Application hosting and cron job
                      scheduling for notifications. Vercel is SOC 2 Type II
                      certified.
                      <a
                        href="https://vercel.com/legal/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        View Vercel Privacy Policy
                      </a>
                    </li>
                    <li>
                      <strong>Web Push Protocol:</strong> For delivering push
                      notifications to your devices. Push notifications are
                      delivered through your browser&apos;s push service (e.g.,
                      Google Cloud Messaging, Apple Push Notification service).
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-gray-800">
                  These services are necessary for Pillker to function. We only
                  share the minimum data required for each service to operate.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Download className="h-6 w-6 text-blue-600" />
                Your Rights & Control
              </h2>
              <div className="space-y-4 text-gray-900">
                <p>
                  You have complete control over your data. Here&apos;s what you
                  can do:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Access Your Data
                    </h3>
                    <p className="text-sm">
                      View all your supplements, adherence records, and
                      preferences directly in the application.
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Modify Your Data
                    </h3>
                    <p className="text-sm">
                      Update, edit, or delete any supplement information,
                      schedules, or preferences at any time.
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Delete Your Account
                    </h3>
                    <p className="text-sm">
                      You can delete your account and all associated data at any
                      time from your profile settings. This action is permanent
                      and cannot be undone.
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Control Notifications
                    </h3>
                    <p className="text-sm">
                      Manage your notification preferences, including disabling
                      specific notification types or all notifications.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Data Retention
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  We retain your data for as long as your account is active.
                  When you delete your account:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All supplement data is permanently deleted</li>
                  <li>All adherence records are permanently deleted</li>
                  <li>All notification preferences are permanently deleted</li>
                  <li>All push subscriptions are removed</li>
                  <li>Passkey credentials are deleted</li>
                </ul>
                <p>
                  Audit logs may be retained for a limited period for security
                  and compliance purposes, but they do not contain personal
                  health information.
                </p>
              </div>
            </section>

            {/* Cookies & Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cookies & Tracking
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>Pillker uses minimal cookies and local storage:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Session Cookies:</strong> To maintain your
                    authentication session. These are essential for the
                    application to function.
                  </li>
                  <li>
                    <strong>Local Storage:</strong> To store your notification
                    preferences and PWA installation state locally on your
                    device.
                  </li>
                </ul>
                <p>
                  We do not use tracking cookies, advertising cookies, or
                  third-party analytics that track you across websites. We do
                  not use fingerprinting or other tracking technologies.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Children&apos;s Privacy
              </h2>
              <p className="text-gray-900">
                Pillker is not intended for children under the age of 13. We do
                not knowingly collect personal information from children under
                13. If you believe we have collected information from a child
                under 13, please contact us immediately so we can delete the
                information.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Changes to This Policy
              </h2>
              <p className="text-gray-900">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by updating the &quot;Last
                updated&quot; date at the top of this page. We encourage you to
                review this policy periodically to stay informed about how we
                protect your information.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-2xl bg-gray-50 p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Questions or Concerns?
              </h2>
              <p className="text-gray-900 mb-4">
                If you have any questions about this Privacy Policy or how we
                handle your data, please contact us:
              </p>
              <div className="space-y-2 text-gray-900">
                <p>
                  <strong className="text-gray-900">Email:</strong>{" "}
                  <a
                    href="mailto:privacy@pillker.com"
                    className="text-blue-600 hover:underline"
                  >
                    privacy@pillker.com
                  </a>
                </p>
                <p>
                  <strong className="text-gray-900">GitHub:</strong>{" "}
                  <a
                    href="https://github.com/ippoboi/pills-me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open an issue on GitHub
                  </a>
                </p>
              </div>
            </section>

            {/* Open Source Note */}
            <section className="rounded-2xl bg-blue-50 p-8 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Open Source & Transparency
              </h2>
              <p className="text-gray-900">
                Pillker is an open-source application. This means you can review
                our source code to verify our privacy practices. We believe in
                transparency and encourage you to audit our codebase. You can
                find our source code on GitHub and even self-host your own
                instance if you prefer complete control over your data.
              </p>
            </section>
          </div>

          {/* Footer CTA */}
          <div className="mt-12 text-center">
            <Link href="/">
              <Button className="rounded-full px-8 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
