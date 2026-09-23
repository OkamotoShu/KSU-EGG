"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Header } from "@/components/header";
import { EggDisplay } from "@/components/egg_display";
import { EventARPhase } from "@/components/event-ar-phase";

export default function HatchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});
  const [isAllScanned, setIsAllScanned] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReplay] = useState(() =>
    typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("replay") === "1"
  );

  useEffect(() => {
    // ▼ 1. 現在のURL（replayパラメータがある場合は含める）からリダイレクトパスを生成
    const currentUrl = `/hatch${isReplay ? "?replay=1" : ""}`;
    const redirectPath = `/register?redirect=${encodeURIComponent(currentUrl)}`;

    const load = async (user: User) => {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        
        // ▼ 2. ドキュメントが存在しない、または nickName が未設定なら登録画面へ
        if (!snapshot.exists() || !snapshot.data()?.nickName) {
          router.push(redirectPath);
          return;
        }
        
        const data = snapshot.data();
        setNicknames(data.orderedNames || Object.keys(data.nickName || {}));
        setEggDataMap(data.nickName || {});
        
        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];
        const allScanned = !scannedQRs.slice(0, 5).includes(0);
        setIsAllScanned(allScanned);
        setIsConfirmed(allScanned);
      } catch (error) {
        console.error("孵化データの取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // ▼ 3. 未ログインの場合も生成したリダイレクトパスへ飛ばす
        router.push(redirectPath);
      } else {
        setCurrentUser(user);
        void load(user);
      }
    });
    
    return () => unsubscribe();
  }, [router, isReplay]); // ← 依存配列に isReplay を追加

  const finishHatching = async () => {
    if (!currentUser || isUpdating) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) throw new Error("ユーザーデータが見つかりません");
      const scannedQRs = [...(snapshot.data().scannedQRs || [0, 0, 0, 0, 0, 0])];
      scannedQRs[5] = 1;
      await updateDoc(userRef, { scannedQRs });
      setIsFinished(true);
    } catch (error) {
      console.error("孵化結果の保存に失敗しました:", error);
      alert("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-dvh items-center justify-center bg-[#FFFCF3] text-[#18366B]">読み込み中...</div>;
  }

  if (!isAllScanned && !isConfirmed) {
    return (
      <>
        <Header />
        <main className="flex min-h-dvh items-center justify-center bg-[#FFFCF3] px-5 pt-24 text-[#18366B]">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-4xl">⚠️</p>
            <h1 className="mt-3 text-xl font-extrabold">まだ見つけていない場所があるよ！</h1>
            <p className="mt-3 text-sm leading-7 text-[#65748B]">このままでも孵化できるけれど、見つけていない場所へ戻ることもできるよ。</p>
            <button onClick={() => router.push("/")} className="mt-6 min-h-12 w-full rounded-2xl bg-[#E5E7EB] px-4 font-bold">ホームにもどる</button>
            <button onClick={() => setIsConfirmed(true)} className="mt-3 min-h-12 w-full rounded-2xl bg-[#FFBC39] px-4 font-extrabold">このままARで孵化する</button>
          </div>
        </main>
      </>
    );
  }

  if (!isFinished) {
    return (
      <>
        <Header />
        <EventARPhase
          mode="hatch"
          character={1}
          players={nicknames.map((name) => {
            const answers = eggDataMap[name] || [];
            const eggType = answers[0] || 1;
            const nest = answers[1] || 1;
            const color = answers[2] || 1;
            const pattern = answers[3] || 1;
            const state = { egg: `/egg_${eggType}_${color}.png`, nest: `/nest_${nest}.png`, pattern: `/pattern_${pattern}.png` };
            return {
              name,
              before: state,
              after: state,
              monster: `/monster_${eggType}_${nest}_${color}_0.png`,
              aura: `/aura_${pattern}.png`,
              marks: [],
            };
          })}
          isSaving={isReplay ? false : isUpdating}
          onComplete={() => isReplay ? router.push("/") : void finishHatching()}
          onSkip={() => isReplay ? router.push("/") : void finishHatching()}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex min-h-dvh items-center justify-center bg-[#FFFCF3] px-5 pt-24 pb-10 text-[#18366B]">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-extrabold text-[#50331D]">やったね！</h1>
          <p className="mt-2 font-bold text-[#65748B]">みんなのモンスターが生まれたよ！</p>
          <div className={`mt-6 grid gap-3 ${nicknames.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {nicknames.map((name) => {
              const answers = eggDataMap[name] || [];
              const monster = `/monster_${answers[0] || 1}_${answers[1] || 1}_${answers[2] || 1}_0.png`;
              return (
                <div key={name} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="mx-auto aspect-square max-w-[160px]">
                    <EggDisplay eggSrc={monster} nestSrc="/nest_0.png" patternSrc="/pattern_0.png" auraSrc={`/aura_${answers[3] || 1}.png`} />
                  </div>
                  <p className="mt-1 text-sm font-extrabold">{name}さん</p>
                </div>
              );
            })}
          </div>
          <button onClick={() => router.push("/")} className="mt-6 min-h-14 w-full rounded-2xl bg-[#FFBC39] px-4 font-extrabold">ホームへ戻る</button>
        </div>
      </main>
    </>
  );
}
