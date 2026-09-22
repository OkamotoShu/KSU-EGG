// components/header.tsx
import { Egg } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-center bg-[#FFFCF3] px-4">
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


        {/* 文字ごとにブランドカラーを設定 */}
        <span
          aria-label="KSU EGG"
          className="inline-flex items-center text-2xl font-extrabold tracking-wide"
        >
          <span aria-hidden="true" className="text-[#EF3438]">K</span>
          <span aria-hidden="true" className="text-[#23B4BA]">S</span>
          <span aria-hidden="true" className="text-[#C4D700]">U</span>

          <span aria-hidden="true" className="ml-2 text-[#123588]">E</span>
          <span aria-hidden="true" className="text-[#F6AB00]">G</span>
          <span aria-hidden="true" className="text-[#EF3438]">G</span>
        </span>

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