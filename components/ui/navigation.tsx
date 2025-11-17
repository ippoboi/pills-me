"use client";

import { GivePillFreeIcons, Sun01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks";

const tabs: {
  label: string;
  icon: HugeiconsIconProps["icon"] | null;
  href: string;
}[] = [
  {
    label: "Today",
    icon: Sun01FreeIcons,
    href: "/todos",
  },
  {
    label: "Supplements",
    icon: GivePillFreeIcons,
    href: "/supplements",
  },
  {
    label: "Profile",
    icon: null,
    href: "/profile",
  },
];

export function Navigation() {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const resolveActiveFromPath = (path: string | null) => {
    if (!path) return tabs[0].href;
    // Prefer the longest matching href so /protected/profile beats /protected
    let best: string | null = null;
    for (const t of tabs) {
      const isExact = path === t.href;
      const isPrefix = path.startsWith(`${t.href}/`);
      if (isExact || isPrefix) {
        if (!best || t.href.length > best.length) best = t.href;
      }
    }
    return best ?? tabs[0].href;
  };
  const initialActive = resolveActiveFromPath(pathname);
  const [activeHref, setActiveHref] = useState<string>(initialActive);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTabElementRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const matched = resolveActiveFromPath(pathname);
    setActiveHref(matched);
  }, [pathname]);

  useEffect(() => {
    const container = containerRef.current;
    const activeEl = activeTabElementRef.current as HTMLElement | null;
    if (activeEl && container) {
      const { offsetLeft, offsetWidth } = activeEl;
      const clipLeft = offsetLeft;
      const clipRight = offsetLeft + offsetWidth;
      const rightPercent = Number(
        100 - (clipRight / container.offsetWidth) * 100
      ).toFixed();
      const leftPercent = Number(
        (clipLeft / container.offsetWidth) * 100
      ).toFixed();
      container.style.clipPath = `inset(0 ${rightPercent}% 0 ${leftPercent}% round 17px)`;
    }
  }, [activeHref, activeTabElementRef, containerRef]);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      setActiveHref((prev) => prev);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  return (
    <div
      className="shadow-2xl shadow-gray-200 rounded-[22px] border border-gray-200 bg-gray-100 p-1"
      data-active={activeHref}
    >
      <div className="relative" data-active={activeHref}>
        <ul className="flex items-center gap-1">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <button
                ref={
                  activeHref === tab.href
                    ? (activeTabElementRef as React.RefObject<HTMLButtonElement>)
                    : undefined
                }
                data-tab={tab.href}
                onClick={() => {
                  setActiveHref(tab.href);
                  // Defer navigation to allow animation to start
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      router.push(tab.href);
                    });
                  });
                }}
                className="rounded-[16px] p-3  transition-colors text-gray-600 flex items-center justify-center"
              >
                {tab.icon ? (
                  <HugeiconsIcon icon={tab.icon} className="h-8 w-8" />
                ) : (
                  <Avatar className="bg-blue-100 text-blue-600 grayscale">
                    <AvatarImage src={user?.avatarUrl || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div
          aria-hidden
          className="absolute inset-0 rounded-[16px] bg-white transition-[clip-path] duration-300 ease-out pointer-events-none"
          ref={containerRef}
          style={{
            clipPath: "inset(0 100% 0 0 round 16px)",
            willChange: "clip-path",
          }}
          data-active={activeHref}
        >
          <ul className="flex items-center gap-1">
            {tabs.map((tab) => (
              <li key={tab.href}>
                <div
                  className="rounded-[16px] p-3 text-blue-600 flex items-center justify-center"
                  data-tab={tab.href}
                >
                  {tab.icon ? (
                    <HugeiconsIcon icon={tab.icon} className="h-8 w-8" />
                  ) : (
                    <Avatar className="bg-blue-50 border border-blue-600 transition-colors duration-300">
                      <AvatarImage src={user?.avatarUrl || ""} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
