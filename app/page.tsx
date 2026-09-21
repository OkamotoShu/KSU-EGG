// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EggDisplay } from "@/components/egg_display";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getUserData } from "@/lib/dbActions";
import { TutorialModal } from "@/components/tutorial_modal";

export default function Home() {
  const router = useRouter();
  
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});
  const [scannedQRs, setScannedQRs] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const closeTutorial = () => {
    localStorage.setItem("tutorialSeen", "true");
    setShowTutorial(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await getUserData();

      if (data && data.nickName) {
        setNicknames(data.orderedNames || Object.keys(data.nickName));
        // ▼ 取得したデータをそのまま保存
        setEggDataMap(data.nickName);
        setScannedQRs(data.scannedQRs || [0, 0, 0, 0, 0, 0]);
        if (!localStorage.getItem("tutorialSeen")) {
          setShowTutorial(true);
        }
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
  const traitPattern   = currentEggData[3]; // 3箇所目: たまごの色

  const isHatched = scannedQRs[5] === 1;
  const monsterSrc = `/monster_${traitEggType}_${traitNest}_${traitColor}_0.png`;
  const eggSrc = isHatched 
    ? monsterSrc 
    : `/egg_${traitEggType}_${traitColor}.png`;
  const nestSrc = isHatched 
    ? "/nest_0.png" 
    : `/nest_${traitNest}.png`;
  const patternSrc = isHatched 
    ? "/pattern_0.png" 
    : `/pattern_${traitPattern}.png`;

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
            <EggDisplay 
              eggSrc={eggSrc} 
              nestSrc={nestSrc} 
              patternSrc={patternSrc} 
            />
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
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </>
  );
}