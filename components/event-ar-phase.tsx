"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

type CharacterType = 1 | 2 | 3;

interface EventARPlayer {
  name: string;
  before: { egg: string; nest: string | null; pattern: string | null };
  after: { egg: string; nest: string | null; pattern: string | null };
  monster?: string;
  aura?: string | null;
  marks: CharacterType[];
}

export function EventARPhase({
  players,
  character,
  mode = "normal",
  isSaving,
  onComplete,
  onSkip,
}: {
  players: EventARPlayer[];
  character: CharacterType;
  mode?: "normal" | "awakening" | "hatch";
  isSaving: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const completedRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "searching" | "found" | "finished" | "error">("starting");
  const [attempt, setAttempt] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [hasTapped, setHasTapped] = useState(false);
  const browserReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const cameraSupported = browserReady
    ? Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia)
    : null;
  const characterNames = ["", "ほしみ〜るちゃん", "むすぶくん", "やまくん"];
  const source = useMemo(() => {
    const data = encodeURIComponent(JSON.stringify(players));
    const viewer = mode === "awakening"
      ? "awakening-viewer.html"
      : mode === "hatch" ? "hatch-viewer.html" : "event-viewer.html";
    return `/ar/${viewer}?character=${character}&players=${data}&attempt=${attempt}`;
  }, [attempt, character, mode, players]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== "ksu-event-ar") return;
      if (event.data.status === "complete" && !completedRef.current) {
        setStatus("finished");
      } else if (event.data.status === "progress") {
        setCompletedCount(Number(event.data.completedCount) || 0);
      } else if (event.data.status === "tapped") {
        setHasTapped(true);
      } else if (["searching", "found", "error"].includes(event.data.status)) {
        setStatus(event.data.status);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onComplete]);

  if (cameraSupported === null) {
    return (
      <div className="fixed inset-x-0 top-20 bottom-0 z-40 flex items-center justify-center bg-[#FFFCF3]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#18366B]/15 border-t-[#18366B]" />
      </div>
    );
  }

  if (!cameraSupported) {
    return (
      <div className="fixed inset-x-0 top-20 bottom-0 z-40 flex items-center justify-center bg-[#FFFCF3] px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#A96500]">EVENT AR</p>
          <h2 className="mt-2 text-xl font-extrabold">カメラを使えません</h2>
          <p className="mt-3 text-sm leading-7">HTTPSのURLで開き、カメラの使用を許可してください。</p>
          <button type="button" onClick={onSkip} className="mt-5 min-h-12 w-full rounded-2xl bg-[#FFE5A3] px-4 font-extrabold">
            ARをスキップ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-20 bottom-0 z-40 flex flex-col bg-[#FFFCF3]">
      {/* 通常ヘッダーとの間に置く、ホーム画面と共通の小見出し */}
      <div className="relative flex h-12 shrink-0 items-center px-4 pr-32">
        <p className="flex items-center gap-2 text-[10px] font-extrabold tracking-[0.16em] text-[#A96500] sm:text-xs">
          <span aria-hidden="true" className="h-1 w-3 rounded-full bg-[#FFBC39]" />
          MY LITTLE ADVENTURE
          <span aria-hidden="true" className="h-1 w-3 rounded-full bg-[#FFBC39]" />
        </p>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSaving}
          className="absolute right-3 min-h-10 rounded-full border-2 border-[#18366B]/10 bg-[#FFE5A3] px-3 text-xs font-extrabold text-[#18366B] shadow-sm disabled:opacity-50"
        >
          ARをスキップ
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#18366B]">
        <iframe
          key={attempt}
          ref={frameRef}
          src={source}
          title="イベントARカメラ"
          allow="camera; accelerometer; gyroscope"
          className="absolute inset-0 h-full w-full border-0"
        />
        {/* アプリの色を使った、カメラ画面用の飾り枠 */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 z-[5] rounded-[30px] border-[6px] border-[#FFFCF3] shadow-[0_0_0_100vmax_#FFFCF3,inset_0_0_0_3px_#FFBC39,0_0_0_2px_rgba(24,54,107,0.25)]">
          <span className="absolute top-3 left-3 h-4 w-4 rounded-full bg-[#269D9C] ring-4 ring-[#FFFCF3]" />
          <span className="absolute top-3 right-3 h-4 w-4 rounded-full bg-[#EF4444] ring-4 ring-[#FFFCF3]" />
          <span className="absolute bottom-3 left-3 h-4 w-4 rounded-full bg-[#C9DB22] ring-4 ring-[#FFFCF3]" />
          <span className="absolute right-3 bottom-3 h-4 w-4 rounded-full bg-[#18366B] ring-4 ring-[#FFFCF3]" />
        </div>
        <div className="absolute inset-x-5 top-5 z-20 rounded-2xl bg-[#FFFCF3]/95 px-4 py-3 text-center">
          <p role="status" className="truncate text-sm font-extrabold text-[#18366B]">
          {status === "starting" && "カメラを準備しています..."}
          {status === "searching" && "カード全体をカメラに映してね"}
          {status === "found" && (mode === "awakening" ? "三人を順番にタップしてね！" : mode === "hatch" ? "ひびの入ったたまごをタップしてね！" : `${characterNames[character]}が、みんなのたまごと遊んでいるよ！`)}
          {status === "finished" && (mode === "awakening" ? "たまごに小さなひびが入ったよ！" : mode === "hatch" ? "みんなのモンスターが生まれたよ！" : "みんなのたまごとの遊びが終わったよ！")}
          {status === "error" && "カメラを開始できませんでした"}
          </p>
        </div>
        {mode === "hatch" && status === "found" && !hasTapped && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center">
            <p className="animate-pulse rounded-full bg-[#FFFCF3]/90 px-4 py-2 text-xs font-extrabold text-[#18366B] shadow-sm motion-reduce:animate-none">
              👆 たまごを3回タップ
            </p>
          </div>
        )}
        <div className="absolute inset-x-5 bottom-5 z-20 mx-auto max-w-md rounded-2xl bg-[#FFFCF3]/95 p-4 text-center text-sm font-bold text-[#18366B]">
        {status === "finished" ? (
          <button
            type="button"
            onClick={() => {
              if (completedRef.current) return;
              completedRef.current = true;
              onComplete();
            }}
            disabled={isSaving}
            className="pointer-events-auto min-h-12 w-full rounded-xl bg-[#FFBC39] px-4 font-extrabold disabled:opacity-50"
          >
            {isSaving ? "きろくしています..." : "次へ進む"}
          </button>
        ) : status === "error" ? (
          <button
            type="button"
            onClick={() => {
              completedRef.current = false;
              setCompletedCount(0);
              setHasTapped(false);
              setStatus("starting");
              setAttempt((current) => current + 1);
            }}
            className="pointer-events-auto min-h-12 w-full rounded-xl bg-[#FFBC39] px-4 font-extrabold"
          >
            もう一度ためす
          </button>
        ) : (
          isSaving
            ? "みんなの結果をきろくしています..."
            : status === "found"
              ? mode === "awakening"
                ? `キャラクターをタップしてね　${completedCount} / 3`
                : mode === "hatch"
                  ? `たまごを3回タップしてね　孵化 ${completedCount} / ${players.length}`
                : `たまごをタップしてね　${completedCount} / ${players.length}`
              : "明るい場所で、カードから少し離してね"
        )}
        </div>
      </div>
    </div>
  );
}
