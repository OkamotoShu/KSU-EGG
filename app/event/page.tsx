// app/event/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Header } from "@/components/header";

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrIdParam = searchParams.get("qrId");

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ▼ 複数人プレイ・たまご情報更新用のステート
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<Record<string, number>>({});
  
  // ▼ 追加: 全員のたまごデータを保持しておくステート
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (!qrIdParam) {
      router.push("/");
      return;
    }

    const fetchEventData = async (user: User) => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          router.push("/register");
          return;
        }

        const data = userSnap.data();
        
        // プレイヤー一覧の取得
        const names = data.orderedNames || Object.keys(data.nickName || {});
        setNicknames(names);
        
        // ▼ 追加: たまごデータをステートに保存
        setEggDataMap(data.nickName || {});

        // 読み取り回数（合計値）を計算
        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];
        const total = scannedQRs.reduce((sum, current) => sum + current, 0);
        setTotalScans(total);

        // イベントデータの取得
        const eventRef = doc(db, "event", total.toString());
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          setQuestion(eventData.content);
          setChoices(eventData.select || []);
        } else {
          setQuestion("イベントデータが見つかりませんでした。");
        }
      } catch (error) {
        console.error("イベント取得エラー:", error);
        setQuestion("エラーが発生しました。");
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
  }, [qrIdParam, router]);

  // ▼ 選択肢を選んだときの処理
  const handleChoiceClick = async (choiceIndex: number) => {
    if (isUpdating || !currentUser || !qrIdParam) return;
    
    const currentName = nicknames[currentPlayerIndex];
    const selectedAnswerNumber = choiceIndex + 1;
    const newAnswers = { ...tempAnswers, [currentName]: selectedAnswerNumber };
    setTempAnswers(newAnswers);

    if (currentPlayerIndex < nicknames.length - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
      return; 
    }

    setIsUpdating(true);
    const qrIndex = parseInt(qrIdParam, 10);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        const newScannedQRs = [...(data.scannedQRs || [0, 0, 0, 0, 0, 0])];
        newScannedQRs[qrIndex] = 1;

        const updatedNickName = { ...data.nickName };
        nicknames.forEach((name) => {
          const answerNum = newAnswers[name];
          updatedNickName[name][totalScans] = answerNum;
        });

        await updateDoc(userRef, {
          scannedQRs: newScannedQRs,
          nickName: updatedNickName
        });

        router.push("/");
      }
    } catch (error) {
      console.error("更新エラー:", error);
      alert("通信エラーが発生しました。");
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />;
  }

  const currentName = nicknames[currentPlayerIndex];
  const eventImageSrc = `/event_${totalScans}.png`;

  // ▼ 追加: 現在のプレイヤーの過去の回答データから画像を特定
  const userAnswers = eggDataMap[currentName] || [];
  const eggType = userAnswers[0] || 0;    // 1回目(インデックス0)の回答＝タイプ
  const eggColor = userAnswers[2] || 0;   // 3回目(インデックス2)の回答＝色
  const eggPattern = userAnswers[3] || 0; // 4回目(インデックス3)の回答＝模様

  const eggImagePath = `/egg_${eggType}_${eggColor}.png`;
  const patternImagePath = `/pattern_${eggPattern}.png`;

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
      
      {/* 複数人プレイ時のインジケーター */}
      {nicknames.length > 1 && (
        <p className="mb-2 text-center text-sm font-bold text-blue-500">
          {currentPlayerIndex + 1} 人目 / {nicknames.length} 人中
        </p>
      )}

      <h2 className="mb-4 text-center text-lg font-bold text-gray-700">
        <span className="text-blue-600">{currentName}</span> のばん
      </h2>

      <div className="mb-6 h-px w-full bg-gray-200" />

      {/* ▼ 変更: イベント画像とたまご画像を重ねて表示 */}
      <div className="mb-6 relative mx-auto flex w-full max-w-[240px] justify-center">
        
        {/* totalScansが3または4のときだけ、後ろにたまごと模様を表示 */}
        {(totalScans === 3 || totalScans === 4) && (
          <>
            <img
              src={eggImagePath}
              alt="たまご"
              className="absolute inset-0 m-auto h-full w-full object-contain"
            />
            <img
              src={patternImagePath}
              alt="模様"
              className="absolute inset-0 m-auto h-full w-full object-contain"
            />
          </>
        )}

        {/* 前面のイベント画像 */}
        <img
          src={eventImageSrc}
          alt="イベント画像"
          className="relative z-10 w-full object-contain drop-shadow-md"
        />
      </div>

      <h1 className="mb-6 text-lg font-bold leading-relaxed text-gray-800">
        {question}
      </h1>
      
      <div className="flex flex-col gap-4">
        {choices.map((choiceText, idx) => (
          <button
            key={idx}
            onClick={() => handleChoiceClick(idx)}
            disabled={isUpdating}
            className="rounded-xl border-2 border-blue-100 bg-blue-50 p-4 text-left font-bold text-blue-700 transition-colors hover:bg-blue-100 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {choiceText}
          </button>
        ))}
      </div>
      
      {isUpdating && (
        <p className="mt-6 text-center text-sm font-bold text-blue-600 animate-pulse">
          きろくしています...
        </p>
      )}
    </div>
  );
}

export default function EventPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 px-4 pb-10">
        <Suspense fallback={<p>読み込み中...</p>}>
          <EventContent />
        </Suspense>
      </main>
    </>
  );
}