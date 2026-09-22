// components/header.tsx
import { Egg } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-center border-b border-[#18366B]/10 bg-[#FFFCF3] px-4">
      {/* ロゴタップでホームへ戻る */}
      <Link href="/"
        aria-label="KSU EGG ホーム"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F2EE]">
          <Egg
            aria-hidden="true"
            className="h-7 w-7 text-[#269D9C]"
            strokeWidth={2.2}
          />
        </span>


        <span className="text-2xl font-extrabold tracking-wide text-[#18366B]">
          KSU EGG
        </span>

      </Link>
    </header>
  );
}