import { Button } from "@/components/ui/button";
import { FileText, Scale, Shield, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Pillker",
  description: "Terms of Service for Pillker supplement tracking application.",
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-blue-50 p-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-800">
              Please read these terms carefully before using Pillker.
            </p>
            <p className="mt-2 text-sm text-gray-800">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700">
            {/* Introduction */}
            <section className="rounded-2xl bg-gray-50 p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Scale className="h-6 w-6 text-blue-600" />
                Agreement to Terms
              </h2>
              <p className="text-gray-900 leading-relaxed">
                By accessing or using Pillker (&quot;the Service&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;).
                If you disagree with any part of these terms, then you may not
                access the Service. These Terms apply to all visitors, users,
                and others who access or use the Service.
              </p>
            </section>

            {/* Use of Service */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Use of Service
              </h2>
              <div className="space-y-4 text-gray-900">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Eligibility
                  </h3>
                  <p>
                    You must be at least 13 years old to use Pillker. By using
                    the Service, you represent and warrant that you are at least
                    13 years of age and have the legal capacity to enter into
                    these Terms.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Account Responsibility
                  </h3>
                  <p>
                    You are responsible for maintaining the security of your
                    account and passkey credentials. You are responsible for all
                    activities that occur under your account. You agree to
                    notify us immediately of any unauthorized use of your
                    account.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Acceptable Use
                  </h3>
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>
                      Use the Service for any illegal purpose or in violation of
                      any laws
                    </li>
                    <li>
                      Attempt to gain unauthorized access to the Service or its
                      related systems
                    </li>
                    <li>
                      Interfere with or disrupt the Service or servers connected
                      to the Service
                    </li>
                    <li>
                      Use automated systems to access the Service without
                      authorization
                    </li>
                    <li>
                      Transmit any viruses, malware, or other harmful code
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Health Disclaimer */}
            <section className="rounded-2xl bg-yellow-50 p-8 border border-yellow-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                Health Disclaimer
              </h2>
              <div className="space-y-3 text-gray-900">
                <p className="font-semibold">
                  IMPORTANT: Pillker is a supplement tracking tool only. It is
                  not a medical device, medical advice, or a substitute for
                  professional medical care.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Pillker does not provide medical advice, diagnosis, or
                    treatment
                  </li>
                  <li>
                    Always consult with a qualified healthcare provider before
                    starting, stopping, or changing any supplement regimen
                  </li>
                  <li>
                    The information you enter into Pillker is for tracking
                    purposes only and should not be used as a substitute for
                    professional medical advice
                  </li>
                  <li>
                    We are not responsible for any health outcomes related to
                    your use of supplements
                  </li>
                  <li>
                    If you experience any adverse effects from supplements, seek
                    immediate medical attention
                  </li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Intellectual Property
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  The Service and its original content, features, and
                  functionality are owned by Pillker and are protected by
                  international copyright, trademark, patent, trade secret, and
                  other intellectual property laws.
                </p>
                <p>
                  Pillker is open source software. The source code is available
                  under the MIT License. You may use, modify, and distribute the
                  code in accordance with the license terms. However, the
                  Pillker name and logo are trademarks and may not be used
                  without permission.
                </p>
              </div>
            </section>

            {/* User Content */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                User Content
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  You retain ownership of all data and content you submit to
                  Pillker (&quot;User Content&quot;). By submitting User
                  Content, you grant us a limited, non-exclusive license to
                  store, process, and display your User Content solely for the
                  purpose of providing the Service to you.
                </p>
                <p>
                  You are solely responsible for your User Content. You
                  represent and warrant that you have all necessary rights to
                  submit your User Content and that it does not violate any
                  third-party rights or applicable laws.
                </p>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Service Availability
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  We strive to provide reliable service, but we do not guarantee
                  that the Service will be available at all times. The Service
                  may be unavailable due to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Scheduled maintenance</li>
                  <li>Technical issues or failures</li>
                  <li>Circumstances beyond our control</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue the
                  Service at any time, with or without notice.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="rounded-2xl bg-gray-50 p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                Limitation of Liability
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PILLKER SHALL NOT BE
                  LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                  OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
                  WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
                  USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
                <p>
                  IN NO EVENT SHALL PILLKER&apos;S TOTAL LIABILITY TO YOU FOR
                  ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE OF THE
                  SERVICE EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12)
                  MONTHS PRIOR TO THE CLAIM (OR, IF YOU HAVEN&apos;T PAID US,
                  ZERO DOLLARS).
                </p>
                <p>
                  Some jurisdictions do not allow the exclusion or limitation of
                  certain damages, so the above limitations may not apply to
                  you.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Indemnification
              </h2>
              <p className="text-gray-900">
                You agree to indemnify and hold harmless Pillker, its officers,
                directors, employees, and agents from any claims, damages,
                obligations, losses, liabilities, costs, or debt, and expenses
                (including attorney&apos;s fees) arising from your use of the
                Service, your violation of these Terms, or your violation of any
                rights of another.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Termination
              </h2>
              <div className="space-y-3 text-gray-900">
                <p>
                  We may terminate or suspend your account and access to the
                  Service immediately, without prior notice or liability, for
                  any reason, including if you breach these Terms.
                </p>
                <p>
                  Upon termination, your right to use the Service will cease
                  immediately. You may delete your account at any time from your
                  profile settings. Upon account deletion, all your data will be
                  permanently removed in accordance with our Privacy Policy.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Changes to Terms
              </h2>
              <p className="text-gray-900">
                We reserve the right to modify or replace these Terms at any
                time. If a revision is material, we will try to provide at least
                30 days notice prior to any new terms taking effect. What
                constitutes a material change will be determined at our sole
                discretion. By continuing to access or use the Service after
                those revisions become effective, you agree to be bound by the
                revised terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Governing Law
              </h2>
              <p className="text-gray-900">
                These Terms shall be interpreted and governed by the laws of the
                jurisdiction in which Pillker operates, without regard to its
                conflict of law provisions. Our failure to enforce any right or
                provision of these Terms will not be considered a waiver of
                those rights.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-2xl bg-gray-50 p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Questions About These Terms?
              </h2>
              <p className="text-gray-900 mb-4">
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <div className="space-y-2 text-gray-900">
                <p>
                  <strong className="text-gray-900">Email:</strong>{" "}
                  <a
                    href="mailto:legal@pillker.com"
                    className="text-blue-600 hover:underline"
                  >
                    legal@pillker.com
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
