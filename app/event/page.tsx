// app/event/page.tsx
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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

  // 確認画面から個別に回答を変更しているか
  const [isEditing, setIsEditing] = useState(false);

  // 画面切り替え直後の連続操作を防ぐ
  const navigationLockRef = useRef(0);

  const lockNavigation = () => {
    navigationLockRef.current = Date.now() + 450;
  };

  const isNavigationLocked = () =>
    isUpdating || Date.now() < navigationLockRef.current;

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

  // 選択内容を保存するだけで、次の人には進まない
  const handleChoiceClick = (choiceIndex: number) => {
    if (isNavigationLocked()) return;

    const name = nicknames[currentPlayerIndex];
    if (!name) return;

    setTempAnswers((previous) => ({
      ...previous,
      [name]: choiceIndex + 1,
    }));
  };

  // 前のプレイヤーに戻る
  const handlePrevious = () => {
    if (isNavigationLocked() || currentPlayerIndex === 0) return;

    lockNavigation();
    setCurrentPlayerIndex((previous) => previous - 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // 次のプレイヤー、または確認画面へ進む
  const handleNextPlayer = () => {
    if (isNavigationLocked()) return;

    const name = nicknames[currentPlayerIndex];
    if (!tempAnswers[name]) return;

    lockNavigation();

    if (isEditing || currentPlayerIndex === nicknames.length - 1) {
      setIsEditing(false);
      setPhase("confirm");
    } else {
      setCurrentPlayerIndex((previous) => previous + 1);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // 確認画面で指定したプレイヤーの回答を変更
  const handleEditPlayer = (index: number) => {
    if (isNavigationLocked()) return;

    lockNavigation();
    setCurrentPlayerIndex(index);
    setIsEditing(true);
    setPhase("question");
    window.scrollTo({ top: 0, behavior: "instant" });
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
    <div
      className={`w-full max-w-md ${phase === "question" || phase === "confirm"
        ? "h-full min-h-0"
        : "my-auto"
        }`}
    >
      {phase === "title" && (
        <TitlePhase
          eventTitle={eventTitle}
          onNext={() => setPhase("question")}
        >
          <div className="mb-5 h-[min(28dvh,220px)]">
            <EventImage {...imageProps} />
          </div>
        </TitlePhase>
      )}

      {phase === "question" && (
        <QuestionPhase
          key={currentPlayerIndex}
          nicknames={nicknames}
          currentPlayerIndex={currentPlayerIndex}
          question={question}
          choices={choices}
          selectedAnswer={tempAnswers[currentName]}
          isEditing={isEditing}
          isUpdating={isUpdating}
          onChoiceClick={handleChoiceClick}
          onPrevious={handlePrevious}
          onNext={handleNextPlayer}
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
          onEditPlayer={handleEditPlayer}
        />
      )}

      {/* ▼ 決定後の結果表示画面 */}
      {phase === "success" && (
        <SuccessPhase
          successMessage={successMessage}
          onFinish={() => router.push("/")}
        >
          {/* 人数に応じてたまごを配置 */}
          <div
            className={`my-3 grid grid-cols-2 justify-items-center gap-x-3 gap-y-2 ${nicknames.length === 1 ? "mx-auto max-w-xs" : ""
              }`}
          >
            {nicknames.map((name, index) => {
              const ans = eggDataMap[name] || [];
              const eType = ans[0] || 0;
              const eColor = ans[2] || 0;
              const ePattern = ans[3] || 0;

              // 3人の場合は最初の1人を上段中央に配置
              const centered =
                nicknames.length === 1 ||
                (nicknames.length === 3 && index === 0);

              // 2段配置では画像の高さを抑える
              const sizeClass =
                nicknames.length === 1
                  ? "max-w-[min(260px,30dvh)]"
                  : nicknames.length === 2
                    ? "max-w-[min(160px,23dvh)]"
                    : "max-w-[min(140px,15dvh)]";

              return (
                <div
                  key={name}
                  className={`flex w-full min-w-0 flex-col items-center ${centered ? "col-span-2" : ""
                    }`}
                >
                  <EggDisplay
                    eggImagePath={`/egg_${eType}_${eColor}.png`}
                    patternImagePath={`/pattern_${ePattern}.png`}
                    showPattern={totalScans >= 4}
                    sizeClass={sizeClass}
                  />

                  {/* 木目調のネームプレート */}
                  <div
                    className="relative mt-1 w-full max-w-[150px] rounded-md border border-[#A66D36] px-5 py-2 shadow-[0_2px_0_#946032]"
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
                    {/* 看板の留め具 */}
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#946032]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 right-2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#946032]"
                    />

                    <p className="text-center text-sm leading-snug font-extrabold text-[#50331D] [overflow-wrap:anywhere]">
                      {name}
                    </p>
                  </div>
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
      <main className="flex h-dvh flex-col items-center overflow-hidden bg-[#FFFCF3] px-4 pt-24 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-[#18366B]">
        <Suspense fallback={<div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />}>
          <EventContent />
        </Suspense>
      </main>
    </>
  );
}