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
  const traitNest = currentEggData[1]; // 2箇所目: 巣のタイプ
  const traitColor = currentEggData[2]; // 3箇所目: たまごの色
  const traitPattern = currentEggData[3]; // 3箇所目: たまごの色

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
      <main className="flex min-h-dvh flex-col items-center bg-[#FFFCF3] px-5 pt-24 pb-28 text-[#18366B]">
        <p
          className="mb-4 flex items-center justify-center gap-3 text-xs font-extrabold tracking-[0.16em] text-[#A96500] sm:text-sm"
          style={{ fontFamily: "var(--font-rounded), sans-serif" }}
        >
          <span aria-hidden="true" className="h-1 w-4 rounded-full bg-[#FFBC39]" />
          MY LITTLE ADVENTURE
          <span aria-hidden="true" className="h-1 w-4 rounded-full bg-[#FFBC39]" />
        </p>
        {/* 名前と左右切り替え */}
        <div className="grid w-full max-w-md shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="前のプレイヤー"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E4F2EE] transition-colors hover:bg-[#D5E9E3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:invisible"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </button>

          <h1
            className="text-center text-[clamp(1.5rem,6vw,2rem)] leading-snug font-extrabold [overflow-wrap:anywhere]"
            style={{ fontFamily: "var(--font-rounded), sans-serif" }}
          >
            {currentName}さん
          </h1>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= nicknames.length - 1}
            aria-label="次のプレイヤー"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E4F2EE] transition-colors hover:bg-[#D5E9E3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:invisible"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        {/* 蛋のメイン展示区域 */}
        <div className="flex w-full flex-1 items-center justify-center py-6">
          <div
            className="relative aspect-square w-full"
            style={{
              maxWidth: "min(480px, max(220px, calc(100dvh - 300px)))",
            }}
          >
            {/* 柔和の淡い黄色背景 */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-[8%] bottom-[3%] rounded-[46%_54%_49%_51%/53%_45%_55%_47%] bg-[#FFF0C2]"
            />

            {/* 蛋、巢と花柄の表示 */}
            <div className="absolute inset-0">
              <EggDisplay
                eggSrc={eggSrc}
                nestSrc={nestSrc}
                patternSrc={patternSrc}
              />
            </div>
          </div>
        </div>

        {/* プレイヤー選択 */}
        {nicknames.length > 1 && (
          <div
            role="group"
            aria-label="プレイヤーを選ぶ"
            className="flex max-w-md shrink-0 flex-wrap justify-center"
          >
            {nicknames.map((name, idx) => (
              <button
                key={name}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`${name}のたまごを表示`}
                aria-pressed={idx === currentIndex}
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 rounded-full transition-all ${idx === currentIndex
                    ? "w-6 bg-[#18366B]"
                    : "w-2.5 bg-[#18366B]/20"
                    }`}
                />
              </button>
            ))}
          </div>
        )}
      </main>

      <Footer />
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </>
  );
}