"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, ScanLine } from "lucide-react";
import card from "@/public/ar/card.png";
import { getUserData, saveARMark } from "@/lib/dbActions";

type Status = "idle" | "starting" | "searching" | "found" | "error";

export default function ARPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<Array<{ name: string; eggType: number; color: number; preferredCharacter: 1 | 2 | 3; marks: Array<1 | 2 | 3> }>>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [characterType, setCharacterType] = useState<1 | 2 | 3>(1);
  const [activeCharacter, setActiveCharacter] = useState<1 | 2 | 3>(1);
  const [activeMarks, setActiveMarks] = useState<Array<1 | 2 | 3>>([]);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const active = status === "starting" || status === "searching" || status === "found";
  const player = players[playerIndex];

  useEffect(() => {
    // 登録済みなら、選択結果に対応するたまごとキャラクターを準備
    void getUserData().then((data) => {
      if (!data?.nickName) return;
      const names: string[] = data.orderedNames || Object.keys(data.nickName);
      setPlayers(names.map((name) => {
        const answers = data.nickName[name] || [];
        const character = ([1, 2, 3].includes(answers[1]) ? answers[1] : 1) as 1 | 2 | 3;
        const savedMarks = data.arMarks?.[name];
        return {
          name,
          eggType: [1, 2].includes(answers[0]) ? answers[0] : 1,
          preferredCharacter: character,
          color: [1, 2, 3, 4].includes(answers[2]) ? answers[2] : 1,
          marks: (Array.isArray(savedMarks) ? savedMarks : [savedMarks])
            .filter((mark): mark is 1 | 2 | 3 => [1, 2, 3].includes(Number(mark))),
        };
      }));
      const firstAnswers = data.nickName[names[0]] || [];
      setCharacterType(([1, 2, 3].includes(firstAnswers[1]) ? firstAnswers[1] : 1) as 1 | 2 | 3);
    }).catch((loadError) => console.error("AR用データの取得に失敗しました:", loadError));
  }, []);

  useEffect(() => {
    // 同じサイトのARフレームからの通知だけを受け付ける
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== "ksu-ar") return;
      if (event.data.action === "mark-earned") {
        const currentPlayer = players[playerIndex];
        if (!currentPlayer || currentPlayer.marks.includes(activeCharacter) || event.data.markType !== activeCharacter) return;
        setPlayers((current) => current.map((item, index) => index === playerIndex ? { ...item, marks: [...item.marks, activeCharacter] } : item));
        void saveARMark(currentPlayer.name, activeCharacter).catch((saveError) => {
          console.error("ARの印の保存に失敗しました:", saveError);
          setPlayers((current) => current.map((item, index) => index === playerIndex ? { ...item, marks: item.marks.filter((mark) => mark !== activeCharacter) } : item));
        });
        return;
      }
      if (["searching", "found"].includes(event.data.status)) {
        setStatus(event.data.status);
      } else if (event.data.status === "error") {
        setError("カメラを開始できませんでした。カメラの許可と通信状況を確認してください。他のアプリでカメラを使用している場合は閉じてください。");
        setStatus("error");
      }
    };
    // 別のタブへ移動したらカメラも停止する
    const onVisibility = () => {
      if (document.hidden) setStatus("idle");
    };
    const onPageHide = () => setStatus("idle");
    window.addEventListener("message", onMessage);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeCharacter, playerIndex, players]);

  useEffect(() => {
    if (status !== "starting") return;
    const timeout = window.setTimeout(() => {
      setError("準備に時間がかかっています。カメラの許可を確認し、もう一度お試しください。");
      setStatus("error");
    }, 60000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const start = () => {
    if (active) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("カメラを使うにはHTTPSのURLで開いてください。パソコンではlocalhostでも試せます。");
      setStatus("error");
      return;
    }
    setError("");
    setActiveCharacter(characterType);
    setActiveMarks(player?.marks ?? []);
    setStatus("starting");
  };

  return (
    <main className="relative flex min-h-dvh flex-col bg-[#FFFCF3] text-[#18366B]">
      {active ? (
        <>
          {/* フレームを外すとカメラ・ワーカーも破棄される */}
          <iframe
            ref={frameRef}
            src={`/ar/viewer.html?character=${activeCharacter}&egg=${encodeURIComponent(`/egg_${player?.eggType ?? 1}_${player?.color ?? 1}.png`)}&marks=${activeMarks.join(",")}`}
            title="ARカメラ"
            allow="camera"
            className="fixed inset-0 h-dvh w-full border-0 bg-[#18366B]"
          />
          <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-[#FFFCF3]/95 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
            <p role="status" className="text-sm font-bold">
              {status === "starting" ? "カメラを準備しています..." : status === "found" ? "たまごを見つけた！" : "カード全体をカメラに映してね"}
            </p>
            <button onClick={() => setStatus("idle")} className="min-h-11 shrink-0 rounded-full bg-[#FFE5A3] px-5 font-bold">終了</button>
          </div>
          <p className="fixed inset-x-4 bottom-6 z-10 mx-auto max-w-md rounded-2xl bg-[#FFFCF3]/95 p-4 text-center text-sm">
            {status === "found" ? "たまごをタップして、キャラクターと遊ぼう！" : "明るい場所で、カードから少し離してね"}
          </p>
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Link href="/about" className="mb-5 inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" />アプリについて</Link>
          <div className="text-center">
            <p className="text-xs font-extrabold tracking-widest text-[#A96500]">KSU EGG · AR</p>
            <h1 className="mt-2 text-2xl font-extrabold">カードから、たまご！</h1>
            <p className="mt-3 text-sm leading-7">このカードにカメラを向けると、<br />ピンクのたまごがあらわれるよ。</p>
          </div>
          <div className="my-5 rounded-3xl border border-[#18366B]/10 bg-white p-4">
            <Image src={card} alt="ARで読み取る黄色いたまごのカード" sizes="(max-width: 448px) 80vw, 360px" className="mx-auto h-48 w-full object-contain" />
            <a href="/ar/card.png" target="_blank" rel="noreferrer" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E4F2EE] text-sm font-bold"><ScanLine className="h-4 w-4" />カードを大きく開く</a>
          </div>
          <ol className="mb-5 list-inside list-decimal space-y-2 text-sm leading-6">
            <li>カードを印刷するか、別の画面に表示する。</li>
            <li>下のボタンを押して、カメラを許可する。</li>
            <li>カード全体を映して、少し待つ。</li>
          </ol>
          {players.length > 0 && (
            <label className="mb-4 block text-sm font-bold">
              ARで表示するプレイヤー
              <select
                value={playerIndex}
                onChange={(event) => {
                  const nextIndex = Number(event.target.value);
                  setPlayerIndex(nextIndex);
                  setCharacterType(players[nextIndex]?.preferredCharacter ?? 1);
                }}
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#18366B]/20 bg-white px-4"
              >
                {players.map((item, index) => (
                  <option key={item.name} value={index}>{item.name}さん</option>
                ))}
              </select>
            </label>
          )}
          {player && (
            <label className="mb-4 block text-sm font-bold">
              いっしょに遊ぶキャラクター
              <select
                value={characterType}
                onChange={(event) => setCharacterType(Number(event.target.value) as 1 | 2 | 3)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#18366B]/20 bg-white px-4"
              >
                <option value={1}>ほしみ〜るちゃん{player.marks.includes(1) ? "　★ もらったよ" : ""}</option>
                <option value={2}>むすぶくん{player.marks.includes(2) ? "　♥ もらったよ" : ""}</option>
                <option value={3}>やまくん{player.marks.includes(3) ? "　◎ もらったよ" : ""}</option>
              </select>
              <span className="mt-2 block text-xs font-normal text-[#65748B]">
                あつめた印：{player.marks.length} / 3
              </span>
            </label>
          )}
          {error && <p role="alert" className="mb-4 rounded-2xl bg-[#FFF0EE] p-4 text-sm leading-6 text-[#B42332]">{error}</p>}
          <button onClick={start} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFBC39] px-4 py-3 font-extrabold focus-visible:outline-2 focus-visible:outline-offset-4"><Camera className="h-5 w-5" />{status === "error" ? "もう一度ためす" : "カメラをはじめる"}</button>
          <p className="mt-3 text-center text-xs leading-6 text-[#65748B]">体験版：平面のたまごイラストを表示します。<br />カメラ映像はこの端末内で処理します。</p>
        </div>
      )}
    </main>
  );
}
