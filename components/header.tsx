// components/header.tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center border-b border-blue-700 bg-blue-600 px-4 shadow-md">
      {/* ロゴタップでホームへ戻る */}
      <Link href="/" className="text-2xl font-bold tracking-wider text-white">
        KSU EGG
      </Link>
    </header>
  );
}