// components/header.tsx
import { Egg, Info } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-center bg-[#FFFCF3] px-4">
      {/* ロゴタップでホームへ戻る */}
      <Link href="/"
        aria-label="KSU EGG ホーム"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0C2]">
          <Egg
            aria-hidden="true"
            className="h-7 w-7 text-[#A96500]"
            strokeWidth={2.2}
          />
        </span>


        {/* 文字ごとにブランドカラーを設定 */}
        <span
          aria-label="KSU EGG"
          className="inline-flex items-center gap-0.5 text-2xl font-extrabold [paint-order:stroke_fill]"
        >
          <span aria-hidden="true" className="text-[#EF3438] [-webkit-text-stroke:3px_#A91F28]">K</span>
          <span aria-hidden="true" className="text-[#23B4BA] [-webkit-text-stroke:3px_#137B80]">S</span>
          <span aria-hidden="true" className="text-[#C4D700] [-webkit-text-stroke:3px_#7D8A00]">U</span>

          <span aria-hidden="true" className="ml-1.5 text-[#123588] [-webkit-text-stroke:3px_#091E55]">E</span>
          <span aria-hidden="true" className="text-[#F6AB00] [-webkit-text-stroke:3px_#A66C00]">G</span>
          <span aria-hidden="true" className="text-[#EF3438] [-webkit-text-stroke:3px_#A91F28]">G</span>
        </span>

      </Link>

      {/* アプリの説明ページへの入口 */}
      <Link
        href="/about"
        aria-label="このアプリについて"
        className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#E4F2EE] text-[#18366B] transition-colors hover:bg-[#D5E9E3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B] sm:right-5"
      >
        <Info
          aria-hidden="true"
          className="h-5 w-5"
          strokeWidth={2}
        />
      </Link>

      {/* ヘッダー下部の赤い波線 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 bottom-0 h-3 overflow-hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="12"
          className="block"
        >
          <defs>
            <pattern
              id="header-wave"
              width="40"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0 6 Q 10 -2 20 6 T 40 6"
                fill="none"
                stroke="#EF3438"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </pattern>
          </defs>

          <rect width="100%" height="12" fill="url(#header-wave)" />
        </svg>
      </div>
    </header>
  );
}
