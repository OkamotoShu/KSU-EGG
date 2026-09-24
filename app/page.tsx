// app/page.tsx
"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EggDisplay } from "@/components/egg_display";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TutorialModal } from "@/components/tutorial_modal";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const [nicknames, setNicknames] = useState<string[]>([]);
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});
  const [scannedQRs, setScannedQRs] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const closeTutorial = () => {
    localStorage.setItem("tutorialSeen", "true");
    setShowTutorial(false);
  };

  const loadUserData = async (uid: string) => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data && data.nickName) {
          setNicknames(data.orderedNames || Object.keys(data.nickName));
          setEggDataMap(data.nickName);
          setScannedQRs(data.scannedQRs || [0, 0, 0, 0, 0, 0]);
          
          if (!localStorage.getItem("tutorialSeen")) {
            setShowTutorial(true);
          }
          setIsLoading(false);
          return;
        }
      }

      router.push("/register");
    } catch (error) {
      console.error("ユーザーデータ取得エラー:", error);
      setFetchError("データの読み込みに失敗しました。電波の良いところで再試行してください。");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUserData(user.uid);
      } else {
        router.push("/register");
      }
    });

    return () => unsubscribe();
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

  if (fetchError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FFFCF3] px-5 text-[#18366B]">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-md">
          <p className="mb-2 text-3xl">⚠️</p>
          <h2 className="mb-3 text-lg font-bold text-[#50331D]">通信エラー</h2>
          <p className="mb-6 text-sm text-[#65748B]">{fetchError}</p>
          <button
            type="button"
            onClick={() => {
              if (auth.currentUser) loadUserData(auth.currentUser.uid);
              else window.location.reload();
            }}
            className="w-full rounded-xl bg-[#FFBC39] py-3 font-extrabold text-[#18366B] shadow-md transition hover:bg-[#FFB020] active:scale-95"
          >
            もう一度試す
          </button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <p className="text-gray-500">データを読み込み中...</p>
      </div>
    );
  }

  const currentName = nicknames[currentIndex] || "プレイヤー";

  const currentEggData = eggDataMap[currentName] || [0, 0, 0, 0, 0, 0];

  const traitEggType = currentEggData[0];
  const traitNest = currentEggData[1];
  const traitColor = currentEggData[2];
  const traitPattern = currentEggData[3];

  const isHatched = scannedQRs[5] === 1;

  // ▼▼▼ 修正：正しくイベントクリア数（0〜4の合計）を計算する ▼▼▼
  const totalEventScans = scannedQRs.slice(0, 5).reduce((sum, val) => sum + val, 0);

  const monsterSrc = `/monster_${traitEggType}_${traitNest || 1}_${traitColor || 1}_0.png`;
  const eggSrc = isHatched
    ? monsterSrc
    : `/egg_${traitEggType}_${traitColor}.png`;
  const nestSrc = isHatched
    ? "/nest_0.png"
    : `/nest_${traitNest}.png`;
  const patternSrc = isHatched
    ? "/pattern_0.png"
    : `/pattern_${traitPattern}.png`;
  const auraSrc = isHatched
    ? `/aura_${traitPattern}.png` 
    : "/aura_0.png";

  const eggButtonColors: Record<
    number,
    { background: string; border: string; foreground: string }
  > = {
    1: { background: "#F8D5DF", border: "#DCA5B6", foreground: "#863D55" },
    2: { background: "#D4EDF3", border: "#9FC8D5", foreground: "#315E70" },
    3: { background: "#D9EBCF", border: "#83B96B", foreground: "#456338" },
    4: { background: "#E9DDF8", border: "#A98BDD", foreground: "#65419C" },
  };

  const neutralButtonColors = {
    background: "#FFFFFF",
    border: "#D1D5DB",
    foreground: "#6B7280",
  };

  const selectedButtonColors =
    eggButtonColors[traitColor] ?? neutralButtonColors;

  const getEggButtonStyle = (disabled: boolean) => {
    const colors = disabled
      ? neutralButtonColors
      : selectedButtonColors;

    return {
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.foreground,
    };
  };

  return (
    <>
      <Header />

      <main className="flex h-dvh flex-col items-center gap-3 bg-[#FFFCF3] px-5 pt-24 pb-28 text-[#18366B]">
        <p className="flex shrink-0 items-center justify-center gap-2 text-[10px] font-extrabold tracking-[0.16em] text-[#A96500] sm:text-xs">
          <span
            aria-hidden="true"
            className="h-1 w-3 rounded-full bg-[#FFBC39]"
          />
          MY LITTLE ADVENTURE
          <span
            aria-hidden="true"
            className="h-1 w-3 rounded-full bg-[#FFBC39]"
          />
        </p>

        <div className={`grid w-full max-w-md shrink-0 items-center gap-3 ${nicknames.length > 1 ? "grid-cols-[48px_minmax(0,1fr)_48px]" : "grid-cols-1"}`}>
          {nicknames.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="前のプレイヤーのたまご"
              style={getEggButtonStyle(currentIndex === 0)}
              className="relative flex h-14 w-12 -rotate-6 items-center justify-center rounded-[50%_50%_46%_46%/60%_60%_40%_40%] border-2 shadow-sm transition-[transform,background-color,border-color,color] duration-200 enabled:hover:rotate-0 enabled:active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:opacity-40 motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-white/80"
              />
              <ChevronLeft
                aria-hidden="true"
                className="h-7 w-7"
                strokeWidth={3}
              />
            </button>
          )}

          <div
            className="relative min-w-0 rounded-lg border border-[#A66D36] px-4 py-3 shadow-[0_3px_0_#946032]"
            style={{
              backgroundColor: "#E8BD80",
              backgroundImage: `
          repeating-linear-gradient(
            2deg,
            transparent 0px,
            transparent 6px,
            rgba(130, 76, 27, 0.12) 7px,
            transparent 8px,
            transparent 13px
          ),
          linear-gradient(
            180deg,
            #F3D29D 0%,
            #E8BD80 55%,
            #DFA96A 100%
          )
        `,
            }}
          >
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1.5 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#946032]"
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 right-1.5 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#946032]"
            />

            <h1
              aria-live="polite"
              aria-atomic="true"
              className="text-center text-lg leading-snug font-extrabold text-[#50331D] [overflow-wrap:anywhere] sm:text-xl"
            >
              {currentName}さん
            </h1>
          </div>

          {nicknames.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= nicknames.length - 1}
              aria-label="次のプレイヤーのたまご"
              style={getEggButtonStyle(currentIndex >= nicknames.length - 1)}
              className="relative flex h-14 w-12 rotate-6 items-center justify-center rounded-[50%_50%_46%_46%/60%_60%_40%_40%] border-2 shadow-sm transition-[transform,background-color,border-color,color] duration-200 enabled:hover:rotate-0 enabled:active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:opacity-40 motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-white/80"
              />
              <ChevronRight
                aria-hidden="true"
                className="h-7 w-7"
                strokeWidth={3}
              />
            </button>
          )}
        </div>

        <div
          className="relative min-h-0 w-full max-w-lg flex-1"
          style={{ containerType: "size" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative aspect-square"
              style={{
                width: "min(100cqw, 100cqh, 480px)",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[8%] bottom-[3%] rounded-[46%_54%_49%_51%/53%_45%_55%_47%] bg-[#FFF0C2]"
              />

              <div className="absolute inset-0">
                <EggDisplay
                  eggSrc={eggSrc}
                  nestSrc={nestSrc}
                  patternSrc={patternSrc}
                  auraSrc={auraSrc}
                  crackSrc={!isHatched && totalEventScans >= 5 ? "/crack.png" : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {nicknames.length > 1 && (
          <div
            role="group"
            aria-label="プレイヤーを選ぶ"
            className="flex shrink-0 items-center justify-center"
          >
            {nicknames.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`${name}のたまごを表示`}
                aria-pressed={index === currentIndex}
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
              >
                <span
                  aria-hidden="true"
                  className={`h-4 w-3 rounded-[50%_50%_45%_45%/60%_60%_40%_40%] transition-colors ${index === currentIndex
                    ? "bg-[#18366B]"
                    : "bg-[#18366B]/20"
                    }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* ▼▼▼ 追加：孵化済みの時だけアンケートボタンを表示 ▼▼▼ */}
        {isHatched && (
          <div className="mt-2 flex w-full shrink-0 justify-center">
            <Link
              href="/form"
              className="flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#269D9C] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E7D7C] active:scale-95"
            >
              アンケートがまだの方はこちら
            </Link>
          </div>
        )}
        {/* ▲▲▲ ここまで ▲▲▲ */}

      </main>

      <Footer />
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </>
  );
}
