// app/page.tsx
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
  // ▼ 追加: 全員のたまご情報を保持するステート
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getUserData();

      if (data && data.nickName) {
        setNicknames(data.orderedNames || Object.keys(data.nickName));
        // ▼ 取得したデータをそのまま保存
        setEggDataMap(data.nickName);
      } else {
        router.push("/register");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [router]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < nicknames.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex min-h-dvh items-center justify-center bg-gray-50">
  //       <p className="text-gray-500">データを読み込み中...</p>
  //     </div>
  //   );
  // }

  // const currentName = nicknames[currentIndex] || "プレイヤー";
  
  // // ▼ 変更: 現在表示しているプレイヤーのたまご情報（配列）を取得
  // // 万が一データがない場合は初期値 [0, 0, 0, 0, 0, 0] を使う
  // const currentEggData = eggDataMap[currentName] || [0, 0, 0, 0, 0, 0];
  
  // // 0番目と1番目の要素を取り出して画像パスを動的に生成
  // const trait1 = currentEggData[0]; //たまごのタイプ
  // const trait2 = currentEggData[1]; //巣の種類
  // const trait3 = currentEggData[2]; //たまごの色
  // const trait4 = currentEggData[3]; //たまごの模様
  // const trait5 = currentEggData[4]; //ヒビ(中から覗く)
  // const eggSrc = `/egg_${trait1}_${trait3}.png`;

  // return (
  //   <>
  //     <Header />
      
  //     <main className="flex min-h-dvh flex-col items-center justify-center pt-20 pb-24 px-4 bg-gray-50">
  //       <div className="mb-6 flex w-full max-w-sm items-center justify-between">
          
  //         {currentIndex > 0 ? (
  //           <button
  //             onClick={handlePrev}
  //             className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 active:scale-95"
  //           >
  //             <ChevronLeft className="h-6 w-6 text-gray-700" />
  //           </button>
  //         ) : (
  //           <div className="w-10" />
  //         )}

  //         <h1 className="text-2xl font-bold tracking-wider text-gray-800">
  //           {currentName}のたまご
  //         </h1>

  //         {currentIndex < nicknames.length - 1 ? (
  //           <button
  //             onClick={handleNext}
  //             className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 active:scale-95"
  //           >
  //             <ChevronRight className="h-6 w-6 text-gray-700" />
  //           </button>
  //         ) : (
  //           <div className="w-10" />
  //         )}
  //       </div>

  //       <div className="rounded-full bg-white p-6 shadow-lg">
  //         {/* 生成した画像パスを渡す */}
  //         <EggDisplay imageSrc={eggSrc} />
  //       </div>

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <p className="text-gray-500">データを読み込み中...</p>
      </div>
    );
  }

  const currentName = nicknames[currentIndex] || "プレイヤー";
  
  const currentEggData = eggDataMap[currentName] || [0, 0, 0, 0, 0, 0];
  
  // ▼ 変更: 配列から情報を取得し、たまごと巣の画像パスを生成
  const traitEggType = currentEggData[0]; // 1箇所目: たまごのタイプ
  const traitNest    = currentEggData[1]; // 2箇所目: 巣のタイプ
  const traitColor   = currentEggData[2]; // 3箇所目: たまごの色
  
  const eggSrc = `/egg_${traitEggType}_${traitColor}.png`;
  const nestSrc = `/nest_${traitNest}.png`;

  return (
    <>
      <Header />
      
      {/* 画面全体の設定。justify-center を外し、中身のflex-1で調整します */}
      <main className="flex min-h-dvh flex-col items-center bg-gray-50 pt-20 pb-24 px-4">
        
        {/* ▼ ヘッダー部分 (shrink-0 をつけて潰れないようにする) */}
        <div className="mb-4 flex w-full max-w-sm shrink-0 items-center justify-between">
          {currentIndex > 0 ? (
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <h1 className="text-2xl font-bold tracking-wider text-gray-800">
            {currentName}のたまご
          </h1>

          {currentIndex < nicknames.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 active:scale-95"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* ▼ 変更: 画面の「上下の余白（空きスペース）」を自動計算して最大まで広がるラッパー */}
        <div className="flex w-full flex-1 min-h-0 items-center justify-center py-2">
          {/* ▼ h-full と aspect-square で、高さの限界まで広がる完全な「円」を作る */}
          {/* max-w-full によって、横幅が足りないスマホでは横幅に合わせて円が縮みます */}
          <div className="flex aspect-square h-full max-h-[380px] max-w-full items-center justify-center rounded-full bg-white shadow-xl">
            <EggDisplay eggSrc={eggSrc} nestSrc={nestSrc} />
          </div>
        </div>

        {/* ▼ インジケーター (shrink-0 をつけて潰れないようにする) */}
        {nicknames.length > 1 && (
          <div className="mt-6 flex shrink-0 gap-2">
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