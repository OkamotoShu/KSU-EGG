// app/event/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Header } from "@/components/header";
import {
  EventImage,
  TitlePhase,
  QuestionPhase,
  ConfirmPhase,
  SuccessPhase,   // 新規追加
  EggDisplay      // 新規追加
} from "@/components/event-phases";

// ▼ 'success' フェーズを追加
type Phase = "title" | "question" | "confirm" | "success";

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrIdParam = searchParams.get("qrId");

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [eventTitle, setEventTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  // ▼ 成功時のメッセージステートを追加
  const [successMessage, setSuccessMessage] = useState("");
  
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<Record<string, number>>({});
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
        
        const names = data.orderedNames || Object.keys(data.nickName || {});
        setNicknames(names);
        setEggDataMap(data.nickName || {});

        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];
        const total = scannedQRs.reduce((sum, current) => sum + current, 0);
        setTotalScans(total);

        const eventRef = doc(db, "event", total.toString());
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          setEventTitle(eventData.title || "イベント発生！"); 
          setQuestion(eventData.content);
          setChoices(eventData.select || []);
          // ▼ DBの success フィールドを取得（なければデフォルト文言）
          setSuccessMessage(eventData.success || "たまごの様子が変わった！");
        } else {
          setEventTitle("エラー");
          setQuestion("イベントデータが見つかりませんでした。");
        }
      } catch (error) {
        console.error("イベント取得エラー:", error);
        setEventTitle("エラー");
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

  const handleChoiceClick = (choiceIndex: number) => {
    const currentName = nicknames[currentPlayerIndex];
    const selectedAnswerNumber = choiceIndex + 1;
    setTempAnswers(prev => ({ ...prev, [currentName]: selectedAnswerNumber }));

    if (currentPlayerIndex < nicknames.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setPhase("confirm");
    }
  };

  const handleRedo = () => {
    setCurrentPlayerIndex(0);
    setTempAnswers({});
    setPhase("question");
  };

  const handleConfirmSave = async () => {
    if (isUpdating || !currentUser || !qrIdParam) return;
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
          updatedNickName[name][totalScans] = tempAnswers[name];
        });

        await updateDoc(userRef, {
          scannedQRs: newScannedQRs,
          nickName: updatedNickName
        });

        // ▼ 保存完了後、すぐホームに戻るのではなく成功画面を表示する
        setEggDataMap(updatedNickName); // 新しい情報を画面に反映
        setTotalScans(prev => prev + 1); // 次のステージに進んだことを反映
        setIsUpdating(false);
        setPhase("success");
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

  // --- イベント中の画像パス算出 (Question/Title フェーズ用) ---
  const currentName = nicknames[currentPlayerIndex] || nicknames[0];
  const userAnswers = eggDataMap[currentName] || [];
  
  const imageProps = {
    totalScans,
    eventImageSrc: `/event_${totalScans}.png`,
    eggImagePath: `/egg_${userAnswers[0] || 0}_${userAnswers[2] || 0}.png`,
    patternImagePath: `/pattern_${userAnswers[3] || 0}.png`
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
      {phase === "title" && (
        <TitlePhase eventTitle={eventTitle} onNext={() => setPhase("question")}>
          <EventImage {...imageProps} />
        </TitlePhase>
      )}

      {phase === "question" && (
        <QuestionPhase
          nicknames={nicknames}
          currentPlayerIndex={currentPlayerIndex}
          question={question}
          choices={choices}
          onChoiceClick={handleChoiceClick}
        >
          <EventImage {...imageProps} />
        </QuestionPhase>
      )}

      {phase === "confirm" && (
        <ConfirmPhase
          nicknames={nicknames}
          tempAnswers={tempAnswers}
          choices={choices}
          isUpdating={isUpdating}
          onConfirmSave={handleConfirmSave}
          onRedo={handleRedo}
        />
      )}

      {/* ▼ 決定後の結果表示画面 */}
      {phase === "success" && (
        <SuccessPhase
          successMessage={successMessage}
          onFinish={() => router.push("/")}
        >
          <div className="flex flex-wrap justify-center gap-6 my-4">
            {nicknames.map((name) => {
              // 最新の状態のデータを取得
              const ans = eggDataMap[name] || [];
              const eType = ans[0] || 0;
              const eColor = ans[2] || 0;
              const ePattern = ans[3] || 0;
              
              // 1人なら大きく、複数人なら小さく表示
              const sizeClass = nicknames.length === 1 ? "max-w-[200px]" : "max-w-[100px]";

              return (
                <div key={name} className="flex flex-col items-center">
                  {nicknames.length > 1 && (
                    <p className="text-sm font-bold text-gray-500 mb-2">{name}</p>
                  )}
                  <EggDisplay
                    eggImagePath={`/egg_${eType}_${eColor}.png`}
                    patternImagePath={`/pattern_${ePattern}.png`}
                    showPattern={totalScans >= 4} // +1されているため、新しい模様判定
                    sizeClass={sizeClass}
                  />
                </div>
              );
            })}
          </div>
        </SuccessPhase>
      )}
    </div>
  );
}

export default function EventPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 px-4 pb-10">
        <Suspense fallback={<div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />}>
          <EventContent />
        </Suspense>
      </main>
    </>
  );
}