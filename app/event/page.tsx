// app/event/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ▼ 複数人プレイ・たまご情報更新用のステート
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!qrIdParam) {
      router.push("/");
      return;
    }

    const fetchEventData = async (user: any) => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          router.push("/register");
          return;
        }

        const data = userSnap.data();
        
        // プレイヤー一覧の取得（入力順の配列）
        const names = data.orderedNames || Object.keys(data.nickName || {});
        setNicknames(names);

        // 読み取り回数（合計値）を計算
        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];
        const total = scannedQRs.reduce((sum, current) => sum + current, 0);
        setTotalScans(total); // 例: 初回なら0、1回クリア後なら1

        // 合計値をドキュメントIDとして event コレクションから設問を取得
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
    // 選択した設問の番号（1番目からなので index + 1）を一時保存
    const selectedAnswerNumber = choiceIndex + 1;
    const newAnswers = { ...tempAnswers, [currentName]: selectedAnswerNumber };
    setTempAnswers(newAnswers);

    // ▼ まだ次のプレイヤーがいる場合、画面を切り替えて処理を終了
    if (currentPlayerIndex < nicknames.length - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
      return; 
    }

    // ▼ 全員が選び終わった場合、一括でFirestoreに保存する
    setIsUpdating(true);
    const qrIndex = parseInt(qrIdParam, 10);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // 1. QR読み取り場所のフラグを1にする
        const newScannedQRs = [...(data.scannedQRs || [0, 0, 0, 0, 0, 0])];
        newScannedQRs[qrIndex] = 1;

        // 2. 全員のたまご情報を更新する
        const updatedNickName = { ...data.nickName };
        nicknames.forEach((name) => {
          // その人が選んだ番号
          const answerNum = newAnswers[name];
          // 初回イベント（totalScans=0）なら配列の0番目に上書き
          updatedNickName[name][totalScans] = answerNum;
        });

        // まとめてFirestoreを更新
        await updateDoc(userRef, {
          scannedQRs: newScannedQRs,
          nickName: updatedNickName
        });

        // ホームへ戻る
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