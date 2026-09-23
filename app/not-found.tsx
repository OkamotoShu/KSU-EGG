import Link from "next/link";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FFFCF3] px-5 pt-24 pb-12 text-[#18366B]">
        <div className="w-full max-w-md text-center">
          {/* 404 と タイトル */}
          <h1 className="mb-2 text-6xl font-extrabold text-[#50331D]">
            404
          </h1>
          <h2 className="mb-2 text-2xl font-extrabold text-[#50331D]">
            Not Found
          </h2>
          
          {/* 説明文 */}
          <p className="mb-8 text-base font-bold text-[#65748B]">
            お探しのページが見つかりませんでした
          </p>

          {/* ホームに戻るボタン */}
          <Link
            href="/"
            className="inline-block w-full rounded-2xl bg-[#FFBC39] py-4 text-base font-extrabold text-[#18366B] shadow-md transition hover:bg-[#FFB020] active:scale-95 text-center"
          >
            ホーム画面へ戻る
          </Link>
        </div>
      </main>
    </>
  );
}