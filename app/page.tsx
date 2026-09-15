"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EggDisplay } from "@/components/egg_display";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getUserData } from "@/lib/dbActions";

export default function Home() {
  const router = useRouter();
  
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getUserData();

      if (data && data.nickName) {
        // orderedNamesがあればそれを使い、なければObject.keysを使う
        setNicknames(data.orderedNames || Object.keys(data.nickName));
      } else {
        router.push("/register");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [router]);

  // ▼ 前のたまごへ（端の場合は何もしないように安全対策）
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ▼ 次のたまごへ（端の場合は何もしないように安全対策）
  const handleNext = () => {
    if (currentIndex < nicknames.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <p className="text-gray-500">データを読み込み中...</p>
      </div>
    );
  }

  const currentName = nicknames[currentIndex] || "プレイヤー";
  const eggSrc = "/egg0.png";

  return (
    <>
      <Header />
      
      <main className="flex min-h-dvh flex-col items-center justify-center pt-20 pb-24 px-4 bg-gray-50">
        <div className="mb-6 flex w-full max-w-sm items-center justify-between">
          
          {/* ▼ 左矢印（1人目より後ろにいる場合のみ表示） */}
          {currentIndex > 0 ? (
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
          ) : (
            <div className="w-10" /> /* レイアウト調整用の空要素 */
          )}

          <h1 className="text-2xl font-bold tracking-wider text-gray-800">
            {currentName}のたまご
          </h1>

          {/* ▼ 右矢印（最後の1人より前にいる場合のみ表示） */}
          {currentIndex < nicknames.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 active:scale-95"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          ) : (
            <div className="w-10" /> /* レイアウト調整用の空要素 */
          )}
        </div>

        <div className="rounded-full bg-white p-6 shadow-lg">
          <EggDisplay imageSrc={eggSrc} />
        </div>

        {/* インジケーター（点々） */}
        {nicknames.length > 1 && (
          <div className="mt-8 flex gap-2">
            {nicknames.map((_, idx) => (
              <div
                key={idx}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}