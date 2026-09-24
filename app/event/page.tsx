// app/event/page.tsx
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Header } from "@/components/header";
import {
  EventImage,
  TitlePhase,
  QuestionPhase,
  ConfirmPhase,
  SuccessPhase,
  EggDisplay
} from "@/components/event-phases";
import { EventARPhase } from "@/components/event-ar-phase";
import { CHARACTER_DETAILS, getEventDefinition, type EventCharacter } from "@/lib/event-data";
import { postCollectionInLogs } from "@/lib/dbActions";

type Phase = "title" | "question" | "confirm" | "arChoice" | "ar" | "success";

type CharacterType = EventCharacter;

function EventContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrIdParam = searchParams.get("qrId");
  const isReplay = searchParams.get("replay") === "1";

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [eventTitle, setEventTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [eventCharacter, setEventCharacter] = useState<CharacterType>(1);

  const [nicknames, setNicknames] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [tempAnswers, setTempAnswers] = useState<Record<string, number>>({});
  const [eggDataMap, setEggDataMap] = useState<Record<string, number[]>>({});
  const [previousEggDataMap, setPreviousEggDataMap] = useState<Record<string, number[]>>({});
  const [arMarks, setARMarks] = useState<Record<string, Array<CharacterType>>>({});

  const [isEditing, setIsEditing] = useState(false);
  const navigationLockRef = useRef(0);

  const lockNavigation = () => {
    navigationLockRef.current = Date.now() + 450;
  };

  const isNavigationLocked = () =>
    isUpdating || Date.now() < navigationLockRef.current;

  // ▼ 変更点：ログイン・登録判定とリダイレクト処理
  useEffect(() => {
    if (!qrIdParam) {
      router.push("/");
      return;
    }

    // QRコードのURL（replayパラメータ含む）をエンコードしてリダイレクト用のパスを作成
    const replayQuery = isReplay ? "&replay=1" : "";
    const currentUrl = `/event?qrId=${qrIdParam}${replayQuery}`;
    const redirectPath = `/register?redirect=${encodeURIComponent(currentUrl)}`;

    const fetchEventData = async (user: User) => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // Firestoreにデータがない、または nickName が未設定なら登録画面へ
        if (!userSnap.exists() || !userSnap.data()?.nickName) {
          router.push(redirectPath);
          return;
        }

        const data = userSnap.data();

        const names = data.orderedNames || Object.keys(data.nickName || {});
        setNicknames(names);
        setEggDataMap(data.nickName || {});
        setPreviousEggDataMap(Object.fromEntries(
          Object.entries(data.nickName || {}).map(([name, answers]) => [
            name,
            isReplay
              ? (answers as number[]).map((value, index) => index < parseInt(qrIdParam, 10) ? value : 0)
              : [...(answers as number[])],
          ])
        ));
        setARMarks(Object.fromEntries(
          Object.entries(data.arMarks || {}).map(([name, value]) => [
            name,
            (Array.isArray(value) ? value : [value]).filter((mark): mark is CharacterType => [1, 2, 3].includes(Number(mark))),
          ])
        ));

        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];
        const total = isReplay
          ? parseInt(qrIdParam, 10)
          : scannedQRs.reduce((sum, current) => sum + current, 0);
        setTotalScans(total);

        const eventData = getEventDefinition(total);

        if (eventData) {
          setEventTitle(eventData.title);
          setQuestion(eventData.content);
          setChoices(eventData.choices);
          setSuccessMessage(eventData.success);
          setEventCharacter(eventData.character);
          if (isReplay) {
            setPhase("ar");
            return;
          }
          if (total === 4) setPhase("arChoice");
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
        // 未ログインの場合も redirect パラメータ付きで登録画面へ
        router.push(redirectPath);
      }
    });

    return () => unsubscribe();
  }, [isReplay, qrIdParam, router]);

  const handleChoiceClick = (choiceIndex: number) => {
    if (isNavigationLocked()) return;
    const name = nicknames[currentPlayerIndex];
    if (!name) return;
    setTempAnswers((previous) => ({
      ...previous,
      [name]: choiceIndex + 1,
    }));
  };

  const handlePrevious = () => {
    if (isNavigationLocked() || currentPlayerIndex === 0) return;
    lockNavigation();
    setCurrentPlayerIndex((previous) => previous - 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

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

  const handleEditPlayer = (index: number) => {
    if (isNavigationLocked()) return;
    lockNavigation();
    setCurrentPlayerIndex(index);
    setIsEditing(true);
    setPhase("question");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const prepareARChoice = () => {
    if (totalScans === 4) {
      setPhase("arChoice");
      return;
    }
    setPhase("question");
  };

  const handleConfirmSave = () => {
    if (isUpdating || !currentUser || !qrIdParam) return;
    const previewData = Object.fromEntries(
      Object.entries(eggDataMap).map(([name, answers]) => [name, [...answers]])
    );
    nicknames.forEach((name) => {
      previewData[name] ??= [];
      previewData[name][totalScans] = tempAnswers[name];
    });
    setEggDataMap(previewData);
    setPhase("arChoice");
  };

  const handleEventComplete = async (awardMark: boolean) => {
    if (isUpdating || !currentUser || !qrIdParam) return;
    const qrIndex = parseInt(qrIdParam, 10);
    if (isNaN(qrIndex) || qrIndex < 0 || qrIndex > 5) {
      alert("不正なQRコードです。");
      router.push("/"); // 不正な場合はホームに戻す
      return;
    }
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("ユーザーデータが見つかりません");
      const data = userSnap.data();
      const savedMarks = data.arMarks || {};
      const updatedMarks = { ...savedMarks };
      const updatedNickName = Object.fromEntries(
        Object.entries(data.nickName || {}).map(([name, value]) => [name, [...(value as number[])]])
      );
      const newScannedQRs = [...(data.scannedQRs || [0, 0, 0, 0, 0, 0])];
      newScannedQRs[qrIndex] = 1;
      nicknames.forEach((name) => {
        const value = savedMarks[name];
        const currentMarks = (Array.isArray(value) ? value : [value])
          .filter((mark): mark is CharacterType => [1, 2, 3].includes(Number(mark)));
        if (awardMark) {
          const earnedCharacters: CharacterType[] = totalScans === 4 ? [1, 2, 3] : [eventCharacter];
          updatedMarks[name] = Array.from(new Set([...currentMarks, ...earnedCharacters])).sort();
        }
        updatedNickName[name] ??= [];
        if (totalScans !== 4) updatedNickName[name][totalScans] = tempAnswers[name];
      });
      await updateDoc(userRef, {
        ...(awardMark ? { arMarks: updatedMarks } : {}),
        nickName: updatedNickName,
        scannedQRs: newScannedQRs,
      });
      await postCollectionInLogs(
        "イベント完了",
        `イベント_${totalScans + 1}回目`,
        `成功 (QR:${qrIdParam})`
      );
      setARMarks(updatedMarks);
      setEggDataMap(updatedNickName);
      setTotalScans((previous) => previous + 1);
      setPhase("success");
    } catch (error) {
      console.error("ARの印の保存に失敗しました:", error);
      alert("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />;
  }

  const currentName = nicknames[currentPlayerIndex] || nicknames[0];
  const userAnswers = eggDataMap[currentName] || [];

  const imageProps = {
    totalScans,
    eventImageSrc: getEventDefinition(totalScans)?.imageSrc || `/event_${totalScans}.png`,
    eggImagePath: `/egg_${userAnswers[0] || 0}_${userAnswers[2] || 0}.png`,
    patternImagePath: `/pattern_${userAnswers[3] || 0}.png`
  };
  const titleVisual = getEventDefinition(totalScans)?.titleVisual;
  const currentCharacter = CHARACTER_DETAILS[eventCharacter];

  // 選択前に、参加者全員の現在のたまごをまとめて見せる
  const allEggsPreview = (
    <div className={`grid h-full w-full place-items-center gap-1 ${nicknames.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {nicknames.map((name) => {
        const answers = eggDataMap[name] || [];
        return (
          <div key={name} className="aspect-square h-full max-h-[105px] min-h-0 w-full max-w-[105px]">
            <EggDisplay
              eggImagePath={`/egg_${answers[0] || 0}_${answers[2] || 0}.png`}
              nestImagePath={answers[1] ? `/nest_${answers[1]}.png` : undefined}
              patternImagePath={`/pattern_${answers[3] || 0}.png`}
              showPattern={Boolean(answers[3])}
              sizeClass="max-w-[105px]"
            />
          </div>
        );
      })}
    </div>
  );

  // 通常イベントでは、担当キャラクターをたまごの横に表示する
  const previewWithCharacter = (preview: React.ReactNode) => (
    <div className="flex h-full w-full min-w-0 items-center justify-center gap-1">
      <div className="flex h-full w-[29%] shrink-0 items-end justify-center">
        <Image
          src={currentCharacter.imageSrc}
          alt={currentCharacter.name}
          width={180}
          height={180}
          unoptimized
          className="max-h-[82%] w-full object-contain"
        />
      </div>
      <div className="h-full min-w-0 flex-1">
        {preview}
      </div>
    </div>
  );

  const allCharactersPreview = (
    <div className="flex h-16 items-end justify-center gap-2">
      {([1, 2, 3] as CharacterType[]).map((character) => (
        <Image
          key={character}
          src={CHARACTER_DETAILS[character].imageSrc}
          alt={CHARACTER_DETAILS[character].name}
          width={100}
          height={100}
          unoptimized
          className="h-full w-16 object-contain"
        />
      ))}
    </div>
  );

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
          speakerName={totalScans >= 1 && totalScans <= 3 ? currentCharacter.name : undefined}
          onNext={prepareARChoice}
        >
          <div className="mb-5 h-[min(28dvh,220px)]">
            {totalScans >= 1 && totalScans <= 3 ? previewWithCharacter(
              titleVisual === "allEggs" ? allEggsPreview : (
                <EventImage
                  {...imageProps}
                  showEggOnly={titleVisual === "egg"}
                />
              )
            ) : titleVisual === "allEggs" ? allEggsPreview : (
              <EventImage
                {...imageProps}
                showEggOnly={titleVisual === "egg"}
              />
            )}
          </div>
        </TitlePhase>
      )}

      {phase === "question" && (
        <QuestionPhase
          key={currentPlayerIndex}
          nicknames={nicknames}
          currentPlayerIndex={currentPlayerIndex}
          question={question}
          speakerName={totalScans >= 1 && totalScans <= 3 ? currentCharacter.name : undefined}
          useChoiceColors={totalScans === 2}
          choiceImageGroups={totalScans === 0
            ? [1, 2].map((type) => [1, 2, 3].map((variant) => `/choicesImg/monster_${type}_${variant}.png`))
            : undefined}
          choices={choices}
          selectedAnswer={tempAnswers[currentName]}
          isEditing={isEditing}
          isUpdating={isUpdating}
          onChoiceClick={handleChoiceClick}
          onPrevious={handlePrevious}
          onNext={handleNextPlayer}
        >
          {totalScans >= 1 && totalScans <= 3 ? previewWithCharacter(
            totalScans === 2 || totalScans === 3 ? (
            <div
              className="relative h-full w-full"
              style={{ containerType: "size" }}
            >
              {/* p02・p03では、表示範囲の短い辺に合わせて現在のたまごを表示する */}
              <div className="absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 [width:min(92cqw,92cqh)]">
                <EggDisplay
                  eggImagePath={`/egg_${userAnswers[0] || 0}_${userAnswers[2] || 0}.png`}
                  nestImagePath={userAnswers[1] ? `/nest_${userAnswers[1]}.png` : undefined}
                  patternImagePath={`/pattern_${userAnswers[3] || 0}.png`}
                  showPattern={Boolean(userAnswers[3])}
                  sizeClass="max-w-none"
                />
              </div>
            </div>
          ) : (
            <EventImage {...imageProps} />
          )) : <EventImage {...imageProps} />}
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

      {phase === "arChoice" && (
        <div className="mx-auto flex w-full max-w-sm flex-col rounded-3xl border border-[#18366B]/10 bg-white p-6 text-center shadow-sm">
          {totalScans === 4 && (
            <div className="mb-4">
              {allCharactersPreview}
              <div className="mt-2 h-32">
                {allEggsPreview}
              </div>
            </div>
          )}
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#A96500]">EVENT AR</p>
          {totalScans === 4 ? (
            <div className="relative mt-5 rounded-2xl border-2 border-[#E2A72F]/25 bg-[#FFF0C2] px-4 pt-5 pb-3 text-left">
              <span className="absolute -top-3 left-4 rounded-full bg-[#FFBC39] px-3 py-1 text-xs font-extrabold text-[#18366B]">
                みんな
              </span>
              <p className="font-extrabold leading-relaxed">「いっしょに、たまごを目覚めさせよう！」</p>
            </div>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-extrabold">ARで遊んでみる？</h2>
              <p className="mt-3 text-sm leading-7 text-[#65748B]">
                カードを一度読み取ると、みんなのたまごが一緒に現れるよ。
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => setPhase("ar")}
            className="mt-6 min-h-14 rounded-2xl bg-[#FFBC39] px-4 font-extrabold text-[#18366B]"
          >
            ARで遊ぶ
          </button>
          <button
            type="button"
            onClick={() => void handleEventComplete(false)}
            disabled={isUpdating}
            className="mt-3 min-h-12 rounded-2xl border-2 border-[#18366B]/15 bg-[#FFFCF3] px-4 text-sm font-bold text-[#18366B] disabled:opacity-40"
          >
            {isUpdating ? "きろくしています..." : "ARをスキップ"}
          </button>
        </div>
      )}

      {phase === "ar" && (
        <EventARPhase
          players={nicknames.map((name) => {
            const savedAnswers = eggDataMap[name] || [];
            const answers = isReplay
              ? savedAnswers.map((value, index) => index <= totalScans ? value : 0)
              : savedAnswers;
            const previousAnswers = previousEggDataMap[name] || [];
            return {
              name,
              before: {
                // AR開始時はホームと同じ、イベント前のたまごを表示する
                egg: `/egg_${previousAnswers[0] || 0}_${previousAnswers[2] || 0}.png`,
                nest: previousAnswers[1] ? `/nest_${previousAnswers[1]}.png` : null,
                pattern: previousAnswers[3] ? `/pattern_${previousAnswers[3]}.png` : null,
              },
              after: {
                egg: `/egg_${answers[0] || 0}_${answers[2] || 0}.png`,
                nest: answers[1] ? `/nest_${answers[1]}.png` : null,
                pattern: answers[3] ? `/pattern_${answers[3]}.png` : null,
              },
              marks: arMarks[name] || [],
            };
          })}
          character={eventCharacter}
          mode={totalScans === 4 ? "awakening" : "normal"}
          isSaving={isReplay ? false : isUpdating}
          onComplete={() => isReplay ? router.push("/") : void handleEventComplete(true)}
          onSkip={() => isReplay ? router.push("/") : void handleEventComplete(false)}
        />
      )}

      {phase === "success" && (
        <SuccessPhase
          successMessage={successMessage}
          onFinish={() => router.push("/")}
        >
          <div
            className={`my-3 grid grid-cols-2 justify-items-center gap-x-3 gap-y-2 ${nicknames.length === 1 ? "mx-auto max-w-xs" : ""
              }`}
          >
            {nicknames.map((name, index) => {
              const ans = eggDataMap[name] || [];
              const eType = ans[0] || 0;
              const eColor = ans[2] || 0;
              const ePattern = ans[3] || 0;

              const centered =
                nicknames.length === 1 ||
                (nicknames.length === 3 && index === 0);

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
                    nestImagePath={ans[1] ? `/nest_${ans[1]}.png` : undefined}
                    patternImagePath={`/pattern_${ePattern}.png`}
                    showPattern={totalScans >= 4}
                    crackImagePath={totalScans >= 5 ? "/crack.png" : undefined}
                    sizeClass={sizeClass}
                  />

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
