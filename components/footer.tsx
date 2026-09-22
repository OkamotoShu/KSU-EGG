"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Egg, QrCode, Map as MapIcon } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "たまご", icon: Egg },
    { href: "/qrreader", label: "QRをよむ", icon: QrCode },
    { href: "/map", label: "マップ", icon: MapIcon },
  ];

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-[#18366B]/10 bg-[#FFFCF3]">
      <nav
        aria-label="メインナビゲーション"
        className="mx-auto flex h-24 max-w-md items-center justify-around px-4 pb-[env(safe-area-inset-bottom)]"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const isScan = href === "/qrreader";

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B] ${
                isActive
                  ? "text-[#18366B]"
                  : "text-[#65748B] hover:text-[#18366B]"
              }`}
            >
              <span
                className={`flex items-center justify-center ${
                  isScan
                    ? "h-12 w-16 rounded-2xl bg-[#FFBC39] text-[#18366B]"
                    : "h-10 w-14 rounded-2xl"
                } ${
                  isActive && !isScan ? "bg-[#E4F2EE]" : ""
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </span>

              <span
                className={`text-xs ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {label}
              </span>

              <span
                aria-hidden="true"
                className={`h-1 w-5 rounded-full ${
                  isActive ? "bg-[#18366B]" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}