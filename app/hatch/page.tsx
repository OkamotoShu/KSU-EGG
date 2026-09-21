// app/hatch/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Header } from "@/components/header";
import { EggDisplay } from "@/components/egg_display";

export default function HatchPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // プレイヤー情報
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // 進行状況・フラグ
  const [isAllScanned, setIsAllScanned] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false); // 未クリア警告を無視して進むか
  const [tapCount, setTapCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchEventData = async (user: User) => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          router.push("/register");
          return;
        }

        const data = userSnap.data();
        const names = data.orderedNames || Object.keys(data.nickName || {});
        setNicknames(names);
        setEggDataMap(data.nickName || {});

        // 0〜4箇所目（合計5つ）がすべて1になっているかチェック
        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];
        const hasUnscanned = scannedQRs.slice(0, 5).includes(0);
        
        if (hasUnscanned) {
          setIsAllScanned(false);
        } else {
          setIsConfirmed(true); // 全箇所クリア済なら確認画面をスキップ
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchEventData(user);
      } else {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ▼ タップしたときの処理
  const handleTap = () => {
    if (tapCount < 10) {
      setTapCount(prev => prev + 1);
    }
  };

  // ▼ 卵を割ったあとに「次へ」を押したときの処理
  const handleNextPlayer = async () => {
    if (currentPlayerIndex < nicknames.length - 1) {
      // 次のプレイヤーへ
      setCurrentPlayerIndex(prev => prev + 1);
      setTapCount(0); // タップ数をリセット
    } else {
      // 全員終了：Firestoreを更新してホームへ
      setIsUpdating(true);
      try {
        if (!currentUser) return;
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const newScannedQRs = [...(data.scannedQRs || [0, 0, 0, 0, 0, 0])];
          newScannedQRs[5] = 1; // ゴール地点をクリア済みにする

          await updateDoc(userRef, { scannedQRs: newScannedQRs });
          router.push("/"); // 将来的にはリザルト画面に飛ばすのもアリです
        }
      } catch (error) {
        console.error("更新エラー:", error);
        alert("エラーが発生しました。");
        setIsUpdating(false);
      }
    }
  };

  if (isLoading) {
    return <div className="flex min-h-dvh items-center justify-center bg-gray-50"><p>読み込み中...</p></div>;
  }

  const currentName = nicknames[currentPlayerIndex];
  const currentEggData = eggDataMap[currentName] || [0, 0, 0, 0];
  
  const monsterSrc = `/monster_${currentEggData[0]}_${currentEggData[1]}_${currentEggData[2]}_0.png`;
  const eggSrc = `/egg_${currentEggData[0]}_${currentEggData[2]}.png`;
  const displaySrc = tapCount >= 10 ? monsterSrc : eggSrc;
  const nestSrc = `/nest_${currentEggData[1]}.png`;
  const patternSrc = `/pattern_${currentEggData[3]}.png`;

  // ▼ 変更点：三項演算子を使わず、未制覇かつ未確認の場合はこの画面を返す
  if (!isAllScanned && !isConfirmed) {
    return (
      <>
        <Header />
        <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 px-4 pb-10">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-4 text-lg font-bold text-gray-800">
              まだ見つけていない場所があるよ！
            </h1>
            <p className="mb-8 text-sm text-gray-600">
              すべての場所をまわらなくても孵化（ふか）させることはできるけど、このまま進んでもいいかな？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-xl bg-gray-200 px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-300 active:scale-95"
              >
                ホームにもどって探す
              </button>
              <button
                onClick={() => setIsConfirmed(true)}
                className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-md"
              >
                このまま孵化させる！
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ▼ 変更点：上の条件に引っかからなかった場合（クリア済み or 確認済み）は、この画面を返す
  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 px-4 pb-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md text-center">
          {nicknames.length > 1 && (
            <p className="mb-2 text-sm font-bold text-blue-500">
              {currentPlayerIndex + 1} 人目 / {nicknames.length} 人中
            </p>
          )}
          <h2 className="mb-4 text-lg font-bold text-gray-700">
            <span className="text-blue-600">{currentName}</span> のばん
          </h2>
          <div className="mb-6 h-px w-full bg-gray-200" />

          <h1 className="mb-4 text-xl font-bold text-gray-800">
            タップしてたまごを割ろう！
          </h1>

          {/* たまごの表示領域（タップ可能） */}
          <button 
            onClick={handleTap}
            disabled={tapCount >= 10}
            className={`relative mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-full bg-blue-50 transition-transform ${tapCount < 10 ? "active:scale-95 active:bg-blue-100" : ""}`}
          >
            {/* 10回タップしたらヒビ割れ画像を被せる等の演出ができます */}
            <div className={`h-full w-full transition-opacity duration-300 ${tapCount >= 10 ? "opacity-50 blur-sm" : ""}`}>
              <EggDisplay eggSrc={displaySrc} nestSrc={nestSrc} patternSrc={patternSrc} />
            </div>
            
            {tapCount >= 10 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-4xl font-black text-yellow-500 drop-shadow-lg rotate-12">ピキッ！</p>
              </div>
            )}
          </button>

          <div className="mt-6 h-8">
            {tapCount < 10 ? (
              <p className="text-lg font-bold text-blue-600">
                あと {10 - tapCount} 回！
              </p>
            ) : (
              <button
                onClick={handleNextPlayer}
                disabled={isUpdating}
                className="rounded-xl bg-green-500 px-8 py-3 font-bold text-white shadow-md transition hover:bg-green-600 active:scale-95 disabled:bg-gray-400"
              >
                {isUpdating ? "きろく中..." : "つぎへ！"}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}