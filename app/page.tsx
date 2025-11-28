"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lock,
  Menu,
  Smartphone,
  X,
  Zap,
  Package,
  Bell,
  CheckCircle,
  Shield,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Medicine02FreeIcons } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { redirect } from "next/navigation";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              How it Works
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              FAQ
            </Link>
            <div className="flex items-center gap-3 ml-4">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-6"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-4 shadow-lg">
          <Link
            href="#features"
            className="block text-sm font-medium text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="block text-sm font-medium text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            How it Works
          </Link>
          <Link
            href="#faq"
            className="block text-sm font-medium text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            FAQ
          </Link>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full rounded-full">
                Log in
              </Button>
            </Link>
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            The Smartest Way to Supplement
          </div>
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl mb-6">
          Never miss a <span className="text-gray-500">supplement</span> again.
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-gray-600 mb-10 leading-relaxed">
          Effortlessly track your daily intake, manage inventory, and build
          healthy habits. The secure, distraction-free tracker that lives on
          your home screen.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/login">
            <Button className="rounded-full px-8 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
              Start Tracking for Free
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              variant="outline"
              className="rounded-full px-8 h-12 text-base border-gray-300 hover:bg-gray-50"
            >
              Learn More
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-16">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
              >
                {/* Placeholder for avatars */}
                <div
                  className={`w-full h-full bg-gradient-to-br from-gray-300 to-gray-400`}
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Join 1,000+ healthy habit builders
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
          <div className="aspect-[16/9] overflow-hidden rounded-xl bg-gray-50 border border-gray-100 relative group">
            {/* Abstract Dashboard Representation */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
              <div className="w-3/4 h-3/4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-12 gap-6 opacity-90 group-hover:scale-[1.02] transition-transform duration-500">
                <div className="col-span-3 space-y-4 border-r border-gray-100 pr-6">
                  <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-2 w-20 bg-gray-100 rounded"></div>
                    <div className="h-2 w-16 bg-gray-100 rounded"></div>
                    <div className="h-2 w-24 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-gray-100 rounded"></div>
                    <div className="h-8 w-8 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
                    <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
                    <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
                  </div>
                  <div className="h-40 bg-gray-50 rounded-xl border border-gray-100"></div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-gray-500 shadow-sm border border-gray-100">
                Dashboard Preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const benefits = [
    {
      title: "Build Unbreakable Streaks",
      description:
        "Consistency is key to results. Smart notifications and visual progress bars keep you accountable every single day.",
      icon: <Zap className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-50",
    },
    {
      title: "Never Run Empty",
      description:
        "Stop guessing when to reorder. We track your remaining capsules automatically and alert you exactly when it's time to refill.",
      icon: <Package className="h-6 w-6 text-green-600" />,
      bg: "bg-green-50",
    },
    {
      title: "Fortress-Grade Privacy",
      description:
        "No passwords to forget. We use modern Passkey technology for biometric-level security. Your data stays private.",
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      bg: "bg-purple-50",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-8 rounded-3xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div
                className={`w-14 h-14 ${benefit.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Add Your Stack",
      description:
        "Input your supplements, dosage, and schedule. Add source URLs to remember where you bought them.",
    },
    {
      number: "02",
      title: "Get Notified",
      description:
        "Receive gentle reminders on your phone or desktop exactly when it's time to take them.",
    },
    {
      number: "03",
      title: "Mark Complete",
      description:
        "One tap to log your intake. Watch your adherence score rise and your inventory update.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Your new routine in 3 simple steps
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Showcase simplicity. It takes seconds to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative pt-8 text-center md:text-left">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-6 mx-auto md:mx-0 ring-8 ring-blue-50">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Installable App (PWA)",
      desc: "Works like a native app—fast, offline-capable.",
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Passkey Auth",
      desc: "Log in with FaceID or TouchID. Secure & fast.",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Adherence Analytics",
      desc: "Visual charts showing your consistency.",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: "Dosage Tracking",
      desc: "Track exact capsule counts and schedules.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Quick Actions",
      desc: "Mark as taken directly from the dashboard.",
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Inventory Tracking",
      desc: "Auto-deduct inventory and refill alerts.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
              Everything you need to optimize your health.
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              We&apos;ve built the tools that help you stay consistent, so you
              can focus on feeling your best.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-900">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative lg:h-[600px] rounded-3xl bg-blue-600 p-8 text-white overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  Live Demo
                </div>
                <div className="text-white/70 text-sm font-medium">
                  My Schedule
                </div>
              </div>

              {/* Simple App Interface */}
              <div className="flex-1 bg-white rounded-2xl text-gray-900 p-6 shadow-xl flex flex-col gap-6 relative overflow-hidden">
                {/* Date Header */}
                <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                  <div>
                    <div className="text-sm text-gray-500 font-medium mb-1">
                      WEDNESDAY
                    </div>
                    <div className="text-2xl font-bold">Today</div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      M
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      T
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-200">
                      W
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      T
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      F
                    </div>
                  </div>
                </div>

                {/* Supplement List */}
                <div className="space-y-3">
                  <MockSupplementCard
                    name="Vitamin D3"
                    capsules={1}
                    schedule="With meal"
                    isTaken={true}
                    adherence={100}
                  />
                  <MockSupplementCard
                    name="Magnesium Glycinate"
                    capsules={2}
                    schedule="Evening"
                    isTaken={false}
                    adherence={92}
                  />
                  <MockSupplementCard
                    name="Omega-3 Fish Oil"
                    capsules={1}
                    schedule="After lunch"
                    isTaken={false}
                    adherence={85}
                  />
                </div>

                {/* Bottom Floating Toast */}
                <div className="mt-auto">
                  <div className="bg-black text-white p-4 rounded-xl flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Streak Active!</div>
                        <div className="text-xs text-gray-400">
                          You&apos;re on a 14 day roll 🔥
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockSupplementCard({
  name,
  capsules,
  schedule,
  isTaken: initialIsTaken,
  adherence,
}: {
  name: string;
  capsules: number;
  schedule: string;
  isTaken: boolean;
  adherence: number;
}) {
  const [isTaken, setIsTaken] = useState(initialIsTaken);

  return (
    <div
      className={cn(
        "bg-white p-2 md:p-3 rounded-3xl transition-colors border border-transparent",
        !isTaken ? "hover:bg-gray-50" : "",
        isTaken && "opacity-60"
      )}
      onClick={() => setIsTaken(!isTaken)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-blue-50 p-3 rounded-2xl md:rounded-xl">
            <HugeiconsIcon
              icon={Medicine02FreeIcons}
              strokeWidth={2}
              className="w-6 h-6 text-blue-600"
            />
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 justify-items-start items-center gap-1 min-w-0">
            <div className="flex flex-col">
              <h3 className="text-[15px] md:text-base font-medium text-gray-900 truncate">
                {name}
              </h3>
              <span className="text-xs text-gray-500">{schedule}</span>
            </div>

            <span className="px-1.5 bg-blue-600 justify-self-end md:justify-self-center text-white font-medium rounded-lg text-sm md:text-base">
              x{capsules}
            </span>

            <div className="hidden md:flex flex-col">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                Recommendation
              </span>
              <span>—</span>
            </div>

            <div className="hidden md:flex flex-col">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                Adherence
              </span>
              <span className="text-green-600 font-medium">{adherence}%</span>
            </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-center">
          <Checkbox
            checked={isTaken}
            onCheckedChange={(checked) => setIsTaken(!!checked)}
          />
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Is Pillker free to use?",
      a: "Yes! You can track your core stack, manage inventory, and get notifications completely for free.",
    },
    {
      q: "How secure is my data?",
      a: "Extremely. We use industry-standard encryption and Passkeys, meaning we don't even store a password for you to lose.",
    },
    {
      q: "Can I use this on my phone?",
      a: "Absolutely. Pillker is designed as a Progressive Web App (PWA). Open it in Safari or Chrome on your mobile device and tap 'Add to Home Screen'.",
    },
    {
      q: "Does it track inventory?",
      a: "Yes. Set your bottle size when you add a supplement, and we'll deduct the count every time you log a dose.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-1 shadow-sm border border-gray-100"
            >
              <button
                className="flex w-full items-center justify-between p-5 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-semibold text-gray-900">{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="text-gray-500" />
                ) : (
                  <ChevronDown className="text-gray-500" />
                )}
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openIndex === i
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl bg-blue-600 px-6 py-16 md:px-20 md:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl mb-6">
              Ready to optimize your health?
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
              Stop forgetting and start feeling the benefits of consistency.
            </p>
            <Link href="/login">
              <Button className="rounded-full px-10 h-14 text-lg bg-white text-blue-600 hover:bg-blue-50 border-none gap-2">
                Get Started Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-blue-200">
              No credit card required. Secure Passkey login.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Pillker Logo"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Pillker
          </span>
        </div>
        <div className="flex gap-8 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-900">
            Terms of Service
          </Link>
          <Link href="/support" className="hover:text-gray-900">
            Support
          </Link>
        </div>
        <p className="text-sm text-gray-400">
          © 2024 Pillker. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return redirect("/auth");
  // <main className="min-h-screen bg-white font-sans">
  //   <Navbar />
  //   <Hero />
  //   <Benefits />
  //   <HowItWorks />
  //   <FeaturesGrid />
  //   <FAQ />
  //   <CTA />
  //   <Footer />
  // </main>
}
