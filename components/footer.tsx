// components/footer.tsx
import Link from "next/link";
import { Home, QrCode, Map as MapIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-24 border-t border-blue-700 bg-blue-600 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <nav className="flex h-full items-center justify-around px-2">
        {/* ホームボタン */}
        <Link 
          href="/" 
          className="flex flex-1 flex-col items-center justify-center gap-1 text-blue-100 hover:text-white transition-colors"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">ホーム</span>
        </Link>

        {/* QRボタン */}
        <Link 
          href="/qrreader" 
          className="flex flex-1 flex-col items-center justify-center gap-1 text-blue-100 hover:text-white transition-colors"
        >
          <QrCode className="h-6 w-6" />
          <span className="text-xs font-medium">QR</span>
        </Link>

        {/* マップボタン */}
        <Link 
          href="/map" 
          className="flex flex-1 flex-col items-center justify-center gap-1 text-blue-100 hover:text-white transition-colors"
        >
          <MapIcon className="h-6 w-6" />
          <span className="text-xs font-medium">マップ</span>
        </Link>
      </nav>
    </footer>
  );
}